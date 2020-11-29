const joi = require('joi');

const createService = joi.object({
  name: joi
    .string()
    .regex(/^[a-zA-Z0-9- ]+$/)
    .message('name can be aplhanumeric, only space, and hyphen allowed in names'),
  // clone_addr: joi.string().uri().required(),
  service: joi.string().valid('git').required(),
  description: joi.string().required(),
  space_id: joi.string().uuid().required(),
});

const cloneService = joi.object({
  service_id: joi.string().uuid().required(),
  target_space_id: joi.string().uuid().required(),
  new_name: joi
    .string()
    .regex(/^[a-zA-Z0-9- ]+$/)
    .message('name can be aplhanumeric, only space, and hyphen allowed in names'),
  new_description: joi.string().required(),
});

module.exports = {
  createService,
  cloneService,
};
