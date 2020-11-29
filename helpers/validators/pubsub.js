const joi = require('joi');

const publishMessageSchema = joi.object({
  topicName: joi.string().required(),
  message: joi.any(),
  customAttributes: joi.object(),
  orderingKey: joi.string(),
  service_id: joi.string().uuid().required(),
});

const createSubscriptionSchema = joi.object({
  topicName: joi.string().required(),
  subscriptionName: joi.string().required(),
});

const deleteSubscriptionSchema = joi.object({
  subscriptionName: joi.string().required(),
});

const topicSchema = joi.object({
  topicName: joi.string().required(),
  enableMessageOrdering: joi.boolean(),
});

module.exports = {
  publishMessageSchema,
  createSubscriptionSchema,
  deleteSubscriptionSchema,
  topicSchema,
};
