const { auth } = require('./google-auth');
const { cloudBuildValidator: { buildConfigSchema } } = require('../helpers/validators');
const { ApiError } = require('../helpers');

const {
  PROJECT_ID,
  GITEA_SSH_IP,
  CLOUDBUILD_TRIGGER_NAME,
  GITEA_SSH_PORT,
  CLUSTER_ID,
  KUBERNETES_ZONE,
  CLOUDBUILD_REPONAME,
} = require('../config');

// eslint-disable-next-line no-unused-vars
const createTrigger = async (req, next) => {
  try {
    const checkValidation = buildConfigSchema.validate(req.body);
    const {
      name,
      ignoredFiles,
      includedFiles,
      disabled,
      substitutions,
      filename,
      github,
      description,
      triggerTemplate,
      tags,
      build,
    } = req.body;
    if (checkValidation.error) {
      throw new ApiError(
        400,
        `Please provide valid fields, ${checkValidation.error}`,
      );
    }
    const data = {
      description,
      name,
      tags,
      triggerTemplate: triggerTemplate
        ? Object.assign(triggerTemplate, { projectId: PROJECT_ID })
        : undefined,
      github,
      ignoredFiles,
      includedFiles,
      disabled,
      substitutions,
      filename,
      build:
        build && build.source.repoSource
          ? Object.assign(build.source.repoSource, { projectId: PROJECT_ID })
          : undefined,
    };
    const client = await auth.getClient();
    try {
      const response = await client.request({
        url: `https://cloudbuild.googleapis.com/v1/projects/${PROJECT_ID}/triggers`,
        method: 'post',
        data,
      });
      return { success: true, data: response.data };
    } catch (err) {
      if (err.code) throw new ApiError(403, 'Check your key permissions and envs');
      throw new ApiError(500, 'Smth bad happened, please write to support');
    }
  } catch (err) {
    return next(err);
  }
};

const runTrigger = async ({
  repoName, repoUser, tenatId, dnsName, deploymentName, commitSha,
}) => {
  console.log('NEW BUILD:', repoUser, repoName, commitSha);

  console.log('runTrigger====runTrigger');
  console.log({
    repoName,
    repoUser,
    tenatId,
    dnsName,
    deploymentName,
  });
  const client = await auth.getClient();
  try {
    const data = {
      projectId: PROJECT_ID,
      branchName: 'master',
      repoName: CLOUDBUILD_REPONAME,
      substitutions: {
        _GITEA_SSH_IP: GITEA_SSH_IP,
        _GITEA_SSH_PORT: GITEA_SSH_PORT,
        _REPO_NAME: repoName,
        _REPO_USER: repoUser,
        _TENANT_ID: tenatId,
        _DNS_NAME: dnsName,
        // ? _REVISION_ID: commitSha,
        _KUBERNETES_CLUSTER: CLUSTER_ID,
        _KUBERNETES_ZONE: KUBERNETES_ZONE,
        _DEPLOYMENT_NAME: deploymentName,
      },
    };

    console.log(data);
    console.log({
      PROJECT_ID,
      CLOUDBUILD_TRIGGER_NAME,
    });

    const response = await client.request({
      url: `https://cloudbuild.googleapis.com/v1/projects/${PROJECT_ID}/triggers/${CLOUDBUILD_TRIGGER_NAME}:run`,
      method: 'post',
      data,
    });
    return { success: true, data: response.data };
  } catch (err) {
    console.log(err);
    if (err.code) throw new ApiError(403, 'Check your key permissions and envs');
    throw new ApiError(500, 'Smth bad happened, please write to support');
  }
};

module.exports = {
  runTrigger,
};
