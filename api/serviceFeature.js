const { GQLClient } = require('../libs');
const {
  SERVICE_FEATURE_QUERIES: { ADD_FEATURE_IN_SERVICE, GET_FEATURE_OF_SERVICE, DELETE_FEATURE_FROM_SERVICE },
} = require('../libs/queries');
const { cloneFeature, addFeatureInConfigJson, removeFeatureFromConfigJson } = require('../libs/gitea');
const { updateDraftServiceVersion } = require('./serviceVersion');

const getFeatureOfService = async (req, res, next) => {
  try {
    const { feature_id, service_id, id } = req.body;
    // const validator = serviceFeatureValidator.getFeatureOfService.validate({ feature_id, service_id, id });
    // if (validator.error) {
    //   throw new ApiError(
    //     400,
    //     `Please provide valid fields, ${validator.error}`
    //   );
    // }
    const { service_feature_map } = await GQLClient.mutate({
      mutation: GET_FEATURE_OF_SERVICE,
      variables: {
        id,
        feature_id,
        service_id,
      },
    });
    res.send({ success: true, data: service_feature_map });
  } catch (error) {
    next(error);
  }
};

const addFeatureInService = async (req, res, next) => {
  try {
    const { feature, service } = req;
    console.log('hasta la vasta');
    const featureObj = {
      feature: feature.repo_name,
      icon: feature.icon,
      name: feature.name,
      path: feature.repo_name,
    };
    await cloneFeature({
      feature_repo_name: feature.repo_name,
      feature_repo_owner: 'root',
      repo_name: service.repo_name,
      path: 'src',
      feature: featureObj,
      repo_owner: service.space.organization_name,
    });
    await addFeatureInConfigJson({
      feature: featureObj,
      repo_name: service.repo_name,
      repo_owner: service.space.organization_name,
    });

    await updateDraftServiceVersion(service);

    const { insert_service_feature_map_one } = await GQLClient.mutate({
      mutation: ADD_FEATURE_IN_SERVICE,
      variables: {
        feature_id: feature.id,
        service_id: service.id,
      },
    });
    res.send({ success: true, data: insert_service_feature_map_one });
  } catch (error) {
    next(error);
  }
};

const deleteFeatureFromService = async (req, res, next) => {
  try {
    const { feature, service } = req;

    await removeFeatureFromConfigJson({
      feature_repo_name: feature.repo_name,
      repo_name: service.repo_name,
      repo_owner: service.space.organization_name,
    });

    //! clear files and dependencies
    await updateDraftServiceVersion(service);

    const { delete_service_feature_map } = await GQLClient.mutate({
      mutation: DELETE_FEATURE_FROM_SERVICE,
      variables: {
        feature_id: feature.id,
        service_id: service.id,
      },
    });
    res.send({ success: true, data: delete_service_feature_map });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFeatureInService,
  getFeatureOfService,
  deleteFeatureFromService,
};
