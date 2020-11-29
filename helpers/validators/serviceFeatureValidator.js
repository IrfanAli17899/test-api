const joi = require('joi');

const getFeatureOfService = joi
  .object({
    id: joi.string().uuid(),
    feature_id: joi.string().uuid(),
    service_id: joi.string().uuid(),
  })
  .xor('id', 'feature_id', 'service_id');

module.exports = {
  getFeatureOfService,
};
