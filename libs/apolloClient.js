const {
  ApolloClient,
  ApolloLink,
  concat,
  InMemoryCache,
} = require('apollo-boost');
const { createUploadLink } = require('apollo-upload-client');
const fetch = require('node-fetch');
const ApiError = require('../helpers/ApiError');
const { HASURA_CLOUD_URI, HASURA_ACCESS_KEY } = require('../config');

const serverLink = HASURA_CLOUD_URI;

const httpLink = createUploadLink({
  uri: serverLink,
  fetch,
  headers: { 'x-hasura-admin-secret': HASURA_ACCESS_KEY },
});

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
};

const consoleMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  console.log('operationName======>>>', operation.operationName);
  console.log('variables======>>>', operation.variables);
  return forward(operation);
});

const client = new ApolloClient({
  link: concat(consoleMiddleware, httpLink),
  cache: new InMemoryCache(),
  defaultOptions,
});

module.exports = {
  async query({ query, variables }) {
    const res = await client.query({ query, variables });
    if (res.errors) {
      throw new ApiError(400, res.errors[0].message);
    }
    return res.data;
  },

  async mutate({ mutation, variables }) {
    const res = await client.mutate({ mutation, variables });
    if (res.errors) {
      throw new ApiError(400, res.errors[0].message);
    }
    return res.data;
  },
};
