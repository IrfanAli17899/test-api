const fs = require('fs');

const ApiError = require('../ApiError');
const {
  PROJECT_ID,
  KUBERNETES_ZONE,
  CLUSTER_ID,
} = require('../../config');

const { GOOGLE_APPLICATION_CREDENTIALS } = process.env;

const cloudbuildEnvValidator = (_req, _res, next) => {
  try {
    if (!PROJECT_ID) throw new ApiError(400, 'Bad envs');
    if (
      !GOOGLE_APPLICATION_CREDENTIALS
      || !fs.existsSync(GOOGLE_APPLICATION_CREDENTIALS)
    ) throw new ApiError(401, 'No gcloud key provided');
    next();
  } catch (error) {
    next(error);
  }
};

const kubernetesEnvValidator = (_req, _res, next) => {
  try {
    if (!PROJECT_ID || !KUBERNETES_ZONE || !CLUSTER_ID) {
      throw new ApiError(400, 'Bad envs');
    }
    if (
      !GOOGLE_APPLICATION_CREDENTIALS
      || !fs.existsSync(GOOGLE_APPLICATION_CREDENTIALS)
    ) throw new ApiError(401, 'No gcloud key provided');
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  kubernetesEnvValidator,
  cloudbuildEnvValidator,
};
