const {
  GQLClient,
} = require('../libs');

const {
  SERVICE_QUERIES: {
    GET_PUBLIC_SERVICES,
  },
} = require('../libs/queries');

const {
  FEATURE_QUERIES: {
    GET_PUBLIC_FEATURES_FROM_FEATURE_LIST,
  },
} = require('../libs/queries');

const getAllFeatures = async (req, res, next) => {
  try {
    const { filter } = req.query;
    const { features } = await GQLClient.query({
      query: GET_PUBLIC_FEATURES_FROM_FEATURE_LIST,
      variables: {
        ilike: filter ? `%${filter}%` : undefined,
      },
    });
    res.send({ success: true, data: features });
  } catch (error) {
    next(error);
  }
};
const getPublicServices = async (req, res, next) => {
  try {
    const { filter } = req.query;
    const result = await GQLClient.query({
      query: GET_PUBLIC_SERVICES,
      variables: {
        ilike: filter ? `%${filter}%` : undefined,
      },
    });
    res.send({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFeatures,
  getPublicServices,
};
