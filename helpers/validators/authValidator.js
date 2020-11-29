const joi = require('joi');

const login = joi.object({
  email: joi
    .string()
    .required()
    .email({ minDomainSegments: 2 })
    .message('Invalid Email Address'),
  password: joi
    .string()
    .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.]).{6,}$/)
    .message(
      // eslint-disable-next-line max-len
      'password must be of eight characters, at least one uppercase letter, one lowercase letter, one number and one special character',
    ),
});

module.exports = {
  login,
};
