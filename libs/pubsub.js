const { PubSub } = require('@google-cloud/pubsub');

const {
  ApiError,
  pubsub: { cutExcess },
} = require('../helpers');

const pubsub = new PubSub();

const createSubscription = async (topicName, subscriptionName) => {
  const [existingSubscriptions] = await pubsub.getSubscriptions();
  existingSubscriptions.forEach((item) => {
    if (
      cutExcess(item.name, 'subscriptions') === subscriptionName
    ) throw new ApiError(400, 'Error in creating subscription: this name is already taken');
  });
  await pubsub.topic(topicName).createSubscription(subscriptionName);
};

// const deleteSubscription = async (req, res, next) => {
//   try {
//     const validate = deleteSubscriptionSchema.validate(req.body);
//     if (validate.error) throw new ApiError(400, 'Provide valid fields');
//     const { subscriptionName } = req.body;
//     const response = await pubsub.deleteSubscription(subscriptionName);
//     res.send({ success: true, data: response });
//   } catch (err) {
//     next(err);
//   }
// };

const createTopic = async (topic_name, enableMessageOrdering) => {
  const [topics] = await pubsub.getTopics();
  const result = topics.map((item) => cutExcess(item.name, 'topics'));
  if (result.includes(topic_name)) throw new ApiError(400, 'Error in creating topic: this name is already taken');
  await pubsub.createTopic(topic_name, { enableMessageOrdering });
};

// const getAllTopics = async (req, res, next) => {
//   try {
//     const { sub } = req.user;
//     const { user_topic_map } = await GQLClient.query({
//       query: GET_USER_TOPICS,
//       variables: {
//         user_auth_id: sub,
//       },
//     });
//     res.send({ success: true, data: user_topic_map });
//   } catch (err) {
//     next(err);
//   }
// };

// const getSubscriptions = async (req, res, next) => {
//   try {
//     const { sub } = req.user;
//     const { user_topic_map } = await GQLClient.query({
//       query: GET_USER_TOPICS,
//       variables: {
//         user_auth_id: sub,
//       },
//     });
//     const subscriptions = [];
//     user_topic_map.forEach(async (item) => {
//       const [response] = await pubsub.topic(item.topic_name).getSubscriptions();
//       subscriptions.concat(response.map((element) => cutExcess(element.name, 'subscriptions')));
//     });
//     res.send({ success: true, data: subscriptions });
//   } catch (err) {
//     next(err);
//   }
// };

// const getSubscriptionsByTopic = async (req, res, next) => {
//   try {
//     const validate = topicSchema.validate(req.query);
//     if (validate.error) throw new ApiError(400, 'Provide valid fields');
//     const { topicName } = req.params;
//     const { sub } = req.user;
//     const { user_topic_map } = await GQLClient.query({
//       query: GET_USER_TOPICS,
//       variables: {
//         user_auth_id: sub,
//       },
//     });
//     if (
//       !user_topic_map.some((item) => item.topic_name === topicName)
//     ) throw new ApiError(400, 'No such topic or you dont have rights');
//     let [response] = await pubsub.topic(topicName).getSubscriptions();
//     response = response.map((item) => cutExcess(item.name, 'subscriptions'));
//     res.send({ success: true, data: response });
//   } catch (err) {
//     next(err);
//   }
// };

// const publishMessage = async (req, res, next) => {
//   try {
//     const validate = publishMessageSchema.validate(req.body);
//     if (validate.error) throw new ApiError(400, 'Provide valid fields');
//     const {
//       topicName, message, customAttributes, orderingKey,
//     } = req.body;
//     const { sub } = req.user;
//     const { user_topic_map } = await GQLClient.query({
//       query: GET_USER_TOPICS,
//       variables: {
//         user_auth_id: sub,
//       },
//     });
//     if (
//       !user_topic_map.some((item) => item.topic_name === topicName)
//     ) throw new ApiError(400, 'No such topic or you dont have rights');
//     const response = await pubsub.topic(topicName).publishMessage({
//       data: Buffer.from(JSON.stringify(Object.assign(message, { userAuthId: req.user.sub }))),
//       customAttributes,
//       orderingKey,
//     });
//     res.send({ success: true, data: `Message ${response} published` });
//   } catch (err) {
//     next(err);
//   }
// };

const deleteTopic = async (topicName) => pubsub.topic(topicName).delete();

module.exports = {
  createSubscription,
  createTopic,
  // getAllTopics,
  // getSubscriptionsByTopic,
  // publishMessage,
  deleteTopic,
  // deleteSubscription,
  // getSubscriptions,
};
