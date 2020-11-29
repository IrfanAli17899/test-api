/* eslint-disable global-require */
module.exports = {
  GQLClient: require('./apolloClient'),
  gitea: require('./gitea'),
  googleAuth: require('./google-auth'),
  k8Client: require('./kubernetes'),
  secretClient: require('./secret'),
  cloudbuildClient: require('./cloudbuild'),
  pubsub: require('./pubsub'),
  // execClient:require('./exec')
};
