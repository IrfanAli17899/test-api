const joi = require('joi');
const {
  SERVICE_FEATURE_QUERIES: { GET_FEATURE_OF_SERVICE },
  SERVICE_QUERIES: { GET_SERVICES },
  FEATURE_QUERIES: { GET_FEATURES_FROM_FEATURE_LIST },
} = require('../../libs/queries');
const GQLClient = require('../../libs/apolloClient');
const ApiError = require('../ApiError');

const keycheckers = joi.object({
  appId: joi.string().uuid().required(),
  featureId: joi.string().uuid().required(),
});

const keysValidator = async (req, _res, next) => {
  try {
    const { app_id: appId, feature_id: featureId } = req.body;
    const validator = keycheckers.validate({ appId, featureId });
    if (validator.error) {
      throw new ApiError(400, `Please provide valid fields, ${validator.error}`);
    }
    const { service: [service] } = await GQLClient.query({
      query: GET_SERVICES,
      variables: {
        id: appId,
        user_auth_id: req.user.sub,
      },
    });
    if (!service) throw new ApiError(400, 'No App Exist With This app_id !!!');
    console.log(service);
    const {
      features: [feature],
    } = await GQLClient.query({
      query: GET_FEATURES_FROM_FEATURE_LIST,
      variables: {
        id: featureId,
      },
    });
    if (!feature) {
      throw new ApiError(400, 'No Feature Exist With This feature_id !!!');
    }
    console.log(feature);
    const secrets = [];
    // const api_keys = JSON.parse(feature.api_keys);
    // if (api_keys && api_keys.length) {
    //   const keys = api_keys.map(({ key }) => `${key}_${service.space.id}`);
    //   console.log(keys);
    //   secrets = await getLastSecretsVersions(keys);
    //   console.log(secrets);
    //   secrets.map((val, i) => {
    //     if (!val) {
    //       throw new ApiError(
    //         400,
    //         `This Feature Requires The Folowing Keys To Be Added In The Corresponding Work Space, ${JSON.stringify(
    //           api_keys[i]
    //         )}`
    //       );
    //     }
    //   });
    // }

    // req.service_feature_map = app;
    req.feature = feature;
    req.service = service;
    req.secrets = secrets;
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const isAllowed = async (req, res, next) => {
  try {
    const { app_id: appId, feature_id: featureId } = req.body;
    const validator = keycheckers.validate({ appId, featureId });
    if (validator.error) {
      throw new ApiError(400, `Please provide valid fields, ${validator.error}`);
    }
    const {
      service_feature_map: [app],
    } = await GQLClient.query({
      query: GET_FEATURE_OF_SERVICE,
      variables: {
        service_id: appId,
        feature_id: featureId,
      },
    });
    if (!app) {
      throw new ApiError(400, 'This Feature Is Not Allowed To This App !!!');
    }
    req.service_feature_map = app;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isAllowed,
  keysValidator,
};
