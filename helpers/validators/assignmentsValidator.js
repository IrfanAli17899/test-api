const joi = require('joi');

const assignment = joi.object({
  service_id: joi
    .array()
    .items(joi.string().uuid()),
  feature_id: joi
    .array()
    .items(joi.string().uuid()),
  serv_feat_id: joi
    .array()
    .items(joi.string().uuid()),
}).min(1);

module.exports = {
  assignment,
};
