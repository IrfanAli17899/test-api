const { GQLClient } = require('../libs');
const { ApiError } = require('../helpers');
const { adminValidator } = require('../helpers/validators');
const {
  FEATURE_QUERIES: {
    CREATE_FEATURE_IN_FEATURE_LIST,
    GET_FEATURES_FROM_FEATURE_LIST,
    ADD_TAG,
    DELETE_TAG,
  },
  TEAM_QUERIES: {
    GET_ASSIGNMENTS,
    AccessLevels,
  },
} = require('../libs/queries');
// provides all features;
const getAllFeatures = async (req, res, next) => {
  try {
    const { body: { id }, user: { sub } } = req;
    const { features } = await GQLClient.query({
      query: GET_FEATURES_FROM_FEATURE_LIST,
      variables: {
        id,
        user_auth_id: sub,
      },
    });
    res.send({ success: true, data: features });
  } catch (error) {
    next(error);
  }
};

// creates a feature in features list;
const createFeature = async (req, res, next) => {
  try {
    const {
      api_keys, name, key, provider, repo_name, icon,
    } = req.body;
    const { sub } = req.user;
    const validator = adminValidator.createFeature.validate({
      name,
      repo_name,
      key,
      api_keys,
      provider,
    });
    if (validator.error) {
      throw new ApiError(
        400,
        `Please provide valid fields, ${validator.error}`,
      );
    }

    await GQLClient.mutate({
      mutation: CREATE_FEATURE_IN_FEATURE_LIST,
      variables: {
        name,
        key,
        provider,
        repo_name,
        icon,
        api_keys: JSON.stringify(api_keys),
        user_auth_id: sub,
      },
    });
    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const addTag = async (req, res, next) => {
  try {
    const {
      body: { id, tags },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    const { features } = await GQLClient.query({
      query: GET_FEATURES_FROM_FEATURE_LIST,
      variables: {
        // assignments_feature:
        // user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.feature_id),
        // user_auth_id: sub,
        // id,
      },
    });
    if (!features) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { update_features_by_pk } = await GQLClient.mutate({
      mutation: ADD_TAG,
      variables: {
        id,
        tags,
      },
    });
    res.send({ success: true, data: update_features_by_pk });
  } catch (error) {
    next(error);
  }
};

const deleteTag = async (req, res, next) => {
  try {
    const {
      body: { id, tags },
      user: { sub },
    } = req;
    const { user_team_map } = await GQLClient.query({
      query: GET_ASSIGNMENTS,
      variables: {
        user_auth_id: sub,
        access_level: AccessLevels.ADMIN,
      },
    });
    const { features } = await GQLClient.query({
      query: GET_FEATURES_FROM_FEATURE_LIST,
      variables: {
        // assignments_feature:
        // user_team_map.flatMap((map) => map.assignments).flatMap((assignments) => assignments.feature_id),
        // user_auth_id: sub,
        // id,
      },
    });
    if (!features) throw new ApiError(403, 'You have no right on this service or it does not exist');
    const { update_features_by_pk } = await GQLClient.mutate({
      mutation: DELETE_TAG,
      variables: {
        id,
        tags,
      },
    });
    res.send({ success: true, data: update_features_by_pk });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFeatures,
  createFeature,
  addTag,
  deleteTag,
};
