const axios = require('axios');
const { USER_QUERIES: { GET_USER, CREATE_USER } } = require('../libs/queries/index');
const { GQLClient } = require('../libs');
const { AUTH_API_URL, AUTH_API_TOKEN } = require('../config');

module.exports = async (req, res, next) => {
  try {
    const response = await GQLClient.query({
      query: GET_USER,
      variables: {
        auth_id: req.user.sub,
      },
    });
    if (!response.user.length) {
      const { data } = await axios({
        url: `https://${AUTH_API_URL}/api/v2/users/${req.user.sub}`,
        headers: { Authorization: `Bearer ${AUTH_API_TOKEN}` },
      })
        .catch((err) => {
          throw new Error(`Auth0 error: ${err.message}: ${err.response.data.message}`);
        });
      await GQLClient.mutate({
        mutation: CREATE_USER,
        variables: {
          auth_id: req.user.sub,
          email: data.email,
          username: data.nickname,
          name: data.name,
        },
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};
