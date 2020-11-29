const joi = require('joi');

const createServiceVersion = joi.object({
  service_id: joi.string().uuid().required(),
  tag: joi.string().required().pattern(/\d+\.\d+\.\d+.*/),
  title: joi.string().optional(),
  note: joi.string().optional(),
  is_prerelease: joi.bool().default(true),
});

const selectServiceVersion = joi.object({
  service_id: joi.string().uuid().required(),
  version_id: joi.string().uuid().required(),
});

const getServiceVersions = joi.object({
  service_id: joi.string().uuid().required(),
  version_id: joi.string().uuid().optional(),
  tag: joi.string().optional(),
  title: joi.string().optional(),
  is_draft: joi.bool().optional(),
  is_prerelease: joi.bool().optional(),
});

module.exports = {
  createServiceVersion,
  selectServiceVersion,
  getServiceVersions,
};
