/* eslint-disable global-require */
module.exports = {
  cloudBuildValidator: require('./cloudbuild'),
  pubsubValidator: require('./pubsub'),
  envValidator: require('./envValidators'),
  serviceValidator: require('./serviceValidator'),
  adminValidator: require('./adminValidator'),
  featureValidator: require('./featureValidator'),
  serviceFeatureValidator: require('./serviceFeatureValidator'),
  serviceVersionValidator: require('./serviceVersionValidator'),
  authValidator: require('./authValidator'),
  spaceValidator: require('./spaceValidator'),
  assignmentValidator: require('./assignmentsValidator'),
};
