const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

const client = new SecretManagerServiceClient();
const { PROJECT_ID } = require('../config');
const { ApiError } = require('../helpers');

const getAllSecretsArray = async () => {
  const [secrets] = await client.listSecrets({
    parent: `projects/${PROJECT_ID}`,
  });
  return secrets.map((secret) => secret.name.replace(/projects\/.*\/secrets\//, ''));
};

const deleteKey = async (secretId) => {
  const array = await getAllSecretsArray();
  if (!array.includes(secretId)) throw new ApiError(400, 'Not exists');
  await client.deleteSecret({ name: `projects/${PROJECT_ID}/secrets/${secretId}` });
  return `${secretId} deleted successfully`;
};

const getAllSecretVersionsArray = async (secretId, filter) => {
  const array = await getAllSecretsArray();
  if (!array.includes(secretId)) throw new ApiError(400, 'secretId not exists');
  const keyPath = `projects/${PROJECT_ID}/secrets/${secretId}`;
  let [versions] = await client.listSecretVersions({
    parent: keyPath,
  });
  if (filter) versions = versions.filter((version) => version.state === filter);
  return versions
    .filter((version) => version.state !== 'DESTROYED')
    .map((version) => version.name.replace(/projects\/.*\/secrets\/.*\/versions\//, ''));
};

const getSecretVersion = async (versionId, secretId) => {
  const array = await getAllSecretVersionsArray(secretId);
  if (!array.includes(versionId)) throw new ApiError(400, 'Version does not exist');
  const [version] = await client.getSecretVersion(
    { name: `projects/${PROJECT_ID}/secrets/${secretId}/versions/${versionId}` },
  );
  return version;
};

const getSecret = async (secretId) => {
  const array = await getAllSecretsArray();
  if (!array.includes(secretId)) throw new ApiError(400, 'Not exists');
  const [secret] = await client.getSecret({
    name: `projects/${PROJECT_ID}/secrets/${secretId}`,
  });
  return secret;
};

const enableSecretVersion = async (versionId, secretId) => {
  const array = await getAllSecretVersionsArray(secretId);
  if (!array.includes(versionId)) {
    throw new ApiError(400, 'Version does not exist or destroyed');
  }
  const [version] = await client.enableSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${secretId}/versions/${versionId}`,
  });
  return version.state;
};

const disableSecretVersion = async (versionId, secretId) => {
  const array = await getAllSecretVersionsArray(secretId);
  if (!array.includes(versionId)) {
    throw new ApiError(400, 'Version does not exist or destroyed');
  }
  const [version] = await client.disableSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${secretId}/versions/${versionId}`,
  });
  return version.state;
};

const destroySecretVersion = async (versionId, secretId) => {
  const array = await getAllSecretVersionsArray(secretId);
  if (!array.includes(versionId)) {
    throw new ApiError(400, 'Version does not exist or destroyed');
  }
  const [version] = await client.destroySecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${secretId}/versions/${versionId}`,
  });
  return version.state;
};

const addSecretVersion = async (secretId, secretData) => {
  const data = Buffer.from(secretData, 'utf8');
  const [version] = await client.addSecretVersion({
    parent: `projects/${PROJECT_ID}/secrets/${secretId}`,
    payload: { data },
  });
  console.log(version);
  return `version ${version.name.replace(/projects\/.*\/secrets\/.*\/versions\//, '')} created`;
};

const accessSecretVersion = async (versionId, secretId) => {
  const array = await getAllSecretVersionsArray(secretId);
  if (!array.includes(versionId)) throw new ApiError(400, 'Version does not exist or destroyed');
  const [version] = await client.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${secretId}/versions/${versionId}`,
  });
  return version.payload.data.toString();
};

const getSecretVersions = async (secretId) => {
  const response = await getAllSecretVersionsArray(secretId);
  return (response);
};

const getAllKeys = async () => {
  const response = await getAllSecretsArray();
  return response;
};

const getLastSecretsVersions = async (secretIds) => {
  const array = await getAllSecretsArray();
  const response = await Promise.all(secretIds.map(async (secretId) => {
    if (!array.includes(secretId)) return '';
    const allVersions = await getAllSecretVersionsArray(secretId, 'ENABLED');
    if (!allVersions.length) return '';
    const lastVersion = Math.max(...allVersions.map((item) => +item));
    const result = await accessSecretVersion(lastVersion.toString(), secretId);
    return result;
  }));
  return response;
};

const createKey = async (secretId) => {
  const array = await getAllSecretsArray();
  if (array.includes(secretId)) return null;
  const check = await client.createSecret({
    parent: `projects/${PROJECT_ID}`,
    secretId,
    secret: {
      replication: {
        automatic: {},
      },
    },
  });
  console.log(check);
  return `${secretId} created successfully`;
};

module.exports = {
  getSecret,
  createKey,
  deleteKey,
  getAllKeys,
  getSecretVersions,
  getSecretVersion,
  accessSecretVersion,
  addSecretVersion,
  destroySecretVersion,
  disableSecretVersion,
  enableSecretVersion,
  getLastSecretsVersions,
};
