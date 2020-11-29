const joi = require('joi');

const createSpace = joi.object({
  description: joi.string().required(),
  name: joi
    .string()
    .regex(/^[a-zA-Z0-9- ]+$/)
    .message('name can be aplhanumeric, only space, and hyphen allowed in names'),
});

module.exports = {
  createSpace,
};
