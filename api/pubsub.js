const { PubSub } = require('@google-cloud/pubsub');
const { GQLClient } = require('../libs');

const {
  ApiError,
  pubsub: { cutExcess, getAllTopicsArray },
} = require('../helpers');

const {
  pubsubValidator: {
    publishMessageSchema, createSubscriptionSchema, deleteSubscriptionSchema, topicSchema,
  },
} = require('../helpers/validators');

const {
  PUBSUB_QUERIES: {
    CREATE_USER_TOPIC,
    DELETE_USER_TOPIC,
    GET_USER_TOPICS,
  },
} = require('../libs/queries');

const pubsub = new PubSub();

const createSubscription = async (req, res, next) => {
  try {
    const validate = createSubscriptionSchema.validate(req.body);
    if (validate.error) throw new ApiError(400, 'Provide valid fields');
    const { topicName, subscriptionName } = req.body;
    const { sub } = req.user;
    const { user_topic_map } = await GQLClient.query({
      query: GET_USER_TOPICS,
      variables: {
        user_auth_id: sub,
      },
    });
    if (
      !user_topic_map.some((item) => item.topic_name === topicName)
    ) throw new ApiError(400, 'No such topic or you dont have rights');
    const [existingSubscriptions] = await pubsub.getSubscriptions();
    existingSubscriptions.forEach((item) => {
      if (
        cutExcess(item.name, 'subscriptions') === subscriptionName
      ) throw new ApiError(400, 'This name is already taken');
    });
    const [subscription] = await pubsub.topic(topicName).createSubscription(subscriptionName);
    res.send({
      success: true,
      data: `${cutExcess(subscription.name, 'subscriptions')} subscription successfully created`,
    });
  } catch (err) {
    next(err);
  }
};

const deleteSubscription = async (req, res, next) => {
  try {
    const validate = deleteSubscriptionSchema.validate(req.body);
    if (validate.error) throw new ApiError(400, 'Provide valid fields');
    const { subscriptionName } = req.body;
    const response = await pubsub.deleteSubscription(subscriptionName);
    res.send({ success: true, data: response });
  } catch (err) {
    next(err);
  }
};

const createTopic = async (req, res, next) => {
  try {
    const validate = topicSchema.validate(req.body);
    if (validate.error) throw new ApiError(400, 'Provide valid fields');
    const { topicName, enableMessageOrdering } = req.body;
    const { sub } = req.user;
    const [topics] = await pubsub.getTopics();
    const result = topics.map((item) => cutExcess(item.name, 'topics'));
    if (result.includes(topicName)) throw new ApiError(400, 'Already exists');
    await pubsub.createTopic(topicName, { enableMessageOrdering });
    await GQLClient.mutate({
      mutation: CREATE_USER_TOPIC,
      variables: {
        user_auth_id: sub,
        topic_name: topicName,
      },
    });
    res.send({ success: true, data: `${topicName} created successfully` });
  } catch (err) {
    next(err);
  }
};

const getAllTopics = async (req, res, next) => {
  try {
    const { sub } = req.user;
    const { user_topic_map } = await GQLClient.query({
      query: GET_USER_TOPICS,
      variables: {
        user_auth_id: sub,
      },
    });
    res.send({ success: true, data: user_topic_map });
  } catch (err) {
    next(err);
  }
};

const getSubscriptions = async (req, res, next) => {
  try {
    const { sub } = req.user;
    const { user_topic_map } = await GQLClient.query({
      query: GET_USER_TOPICS,
      variables: {
        user_auth_id: sub,
      },
    });
    const subscriptions = [];
    user_topic_map.forEach(async (item) => {
      const [response] = await pubsub.topic(item.topic_name).getSubscriptions();
      subscriptions.concat(response.map((element) => cutExcess(element.name, 'subscriptions')));
    });
    res.send({ success: true, data: subscriptions });
  } catch (err) {
    next(err);
  }
};

const getSubscriptionsByTopic = async (req, res, next) => {
  try {
    const validate = topicSchema.validate(req.query);
    if (validate.error) throw new ApiError(400, 'Provide valid fields');
    const { topicName } = req.params;
    const { sub } = req.user;
    const { user_topic_map } = await GQLClient.query({
      query: GET_USER_TOPICS,
      variables: {
        user_auth_id: sub,
      },
    });
    if (
      !user_topic_map.some((item) => item.topic_name === topicName)
    ) throw new ApiError(400, 'No such topic or you dont have rights');
    let [response] = await pubsub.topic(topicName).getSubscriptions();
    response = response.map((item) => cutExcess(item.name, 'subscriptions'));
    res.send({ success: true, data: response });
  } catch (err) {
    next(err);
  }
};

const publishMessage = async (req, res, next) => {
  try {
    const validate = publishMessageSchema.validate(req.body);
    if (validate.error) throw new ApiError(400, 'Provide valid fields');
    const {
      topicName, message, customAttributes, orderingKey, service_id,
    } = req.body;
    // const { sub } = req.user;
    // const { user_topic_map } = await GQLClient.query({
    //   query: GET_USER_TOPICS,
    //   variables: {
    //     user_auth_id: sub,
    //   },
    // });
    // if (
    //   !user_topic_map.some((item) => item.topic_name === topicName)
    // ) throw new ApiError(400, 'No such topic or you dont have rights');
    const response = await pubsub.topic(topicName).publishMessage({
      data: Buffer.from(JSON.stringify({ message, service_id })),
      customAttributes,
      orderingKey,
    });
    res.send({ success: true, data: `Message ${response} published` });
  } catch (err) {
    next(err);
  }
};

const deleteTopic = async (req, res, next) => {
  try {
    const validate = topicSchema.validate(req.body);
    if (validate.error) throw new ApiError(400, 'Provide valid fields');
    const { topicName } = req.body;
    const { sub } = req.user;
    const { user_topic_map } = await GQLClient.query({
      query: GET_USER_TOPICS,
      variables: {
        user_auth_id: sub,
      },
    });
    if (
      !user_topic_map.some((item) => item.topic_name === topicName)
    ) throw new ApiError(400, 'No such topic or you dont have rights');
    await pubsub.topic(topicName).delete();
    await GQLClient.mutate({
      mutation: DELETE_USER_TOPIC,
      variables: {
        user_auth_id: sub,
        topic_name: topicName,
      },
    });
    res.send({ success: true, data: `${topicName} deleted successfully` });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSubscription,
  createTopic,
  getAllTopics,
  getSubscriptionsByTopic,
  publishMessage,
  deleteTopic,
  // deleteSubscription,
  getSubscriptions,
};
