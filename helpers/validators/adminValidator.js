const joi = require('joi');

const createFeature = joi.object({
  name: joi.string().required(),
  repo_name: joi.string().required(),
  provider: joi.string().required(),
  key: joi.string().regex(/^[a-z]+(?:_+[a-z]+)*$/).required(),
  api_keys: joi
    .array()
    .items(
      joi.object({
        label: joi.string().required(),
        key: joi.string().required(),
      }),
    )
    .required(),
});

module.exports = {
  createFeature,
};
