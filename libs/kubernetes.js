/* eslint-disable no-param-reassign */
const k8s = require('@kubernetes/client-node');

const { auth } = require('./google-auth');
const { ApiError } = require('../helpers');

const { PROJECT_ID, KUBERNETES_ZONE, CLUSTER_ID } = require('../config');

const configCluster = async () => {
  const client = await auth.getClient();
  try {
    const res = await client.request({
      url: `https://container.googleapis.com/v1/projects/${PROJECT_ID}/zones/${KUBERNETES_ZONE}/clusters/${CLUSTER_ID}`,
    });
    return res.data;
  } catch (err) {
    throw err.code
      ? new ApiError(403, 'Check your key permissions and envs')
      : new ApiError(500, 'Smth bad happened, please write to support');
  }
};
const deleteDeployment = async (name, namespace) => {
  console.log('name, namespace', name, namespace);
  const cluster = await configCluster();
  const authToken = await auth.getAccessToken();
  const kc = new k8s.KubeConfig();
  const opts = {
    clusters: [{
      name: 'inCluster',
      caFile: '/var/run/secrets/kubernetes.io/serviceaccount/ca.crt',
      server: `https://${cluster.endpoint}`,
      skipTLSVerify: false,
    }],
    users: [{
      name: 'inClusterUser',
      authProvider: {
        name: 'tokenFile',
        config: {
          tokenFile: `${cluster.endpoint}/var/run/secrets/kubernetes.io/serviceaccount/token`,
        },
      },
    }],
    contexts: [
      {
        cluster: 'inCluster',
        name: 'inClusterContext',
        user: 'inClusterUser',
      },
    ],
    currentContext: 'inClusterContext',
  };
  kc.loadFromOptions(opts);
  const k8sApi = kc.makeApiClient(k8s.AppsV1Api);
  k8sApi.setDefaultAuthentication({
    applyToRequest: (options) => {
      options.ca = Buffer.from(
        cluster.masterAuth.clusterCaCertificate,
        'base64',
      );
      if (!options.headers) {
        options.headers = [];
      }
      options.headers.Authorization = `Bearer ${authToken}`;
    },
  });

  const existing = await k8sApi.listNamespacedDeployment(namespace);
  if (!existing.body.items.some((item) => item.metadata.name === name)) {
    throw new ApiError(404, 'No such deployment');
  }
  return (await k8sApi.deleteNamespacedDeployment(name, namespace)).body;
};
const createNamespace = async (namespace) => {
  const space = {
    metadata: {
      name: namespace,
    },
  };
  const cluster = await configCluster();

  const authToken = await auth.getAccessToken();
  const k8sClient = new k8s.CoreV1Api(`https://${cluster.endpoint}`);

  k8sClient.setDefaultAuthentication({
    applyToRequest: (opts) => {
      opts.ca = Buffer.from(
        cluster.masterAuth.clusterCaCertificate,
        'base64',
      );
      if (!opts.headers) {
        opts.headers = [];
      }
      opts.headers.Authorization = `Bearer ${authToken}`;
    },
  });

  const exists = await k8sClient
    .readNamespace(namespace)
    .catch(() => null);
  if (exists) throw new Error('This namespace already exists');

  const response = await k8sClient.createNamespace(space);
  return {
    success: true,
    k8_namespace_uid: response.body.metadata.uid,
    k8_namespace: response.body.metadata.name,
  };
};

const deleteNamespace = async (namespace) => {
  const cluster = await configCluster();

  const authToken = await auth.getAccessToken();
  const k8sClient = new k8s.CoreV1Api(`https://${cluster.endpoint}`);

  k8sClient.setDefaultAuthentication({
    applyToRequest: (opts) => {
      opts.ca = Buffer.from(
        cluster.masterAuth.clusterCaCertificate,
        'base64',
      );
      if (!opts.headers) {
        opts.headers = [];
      }
      opts.headers.Authorization = `Bearer ${authToken}`;
    },
  });

  const exists = await k8sClient
    .readNamespace(namespace)
    .catch(() => null);
  if (!exists) throw new Error('This namespace not exists');

  await k8sClient.deleteNamespace(namespace);

  return {
    success: true,
    data: `${namespace} deleted successfully`,
  };
};

module.exports = { createNamespace, deleteNamespace, deleteDeployment };
