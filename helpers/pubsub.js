const { PubSub } = require('@google-cloud/pubsub');
const { PROJECT_ID } = require('../config');

const pubsub = new PubSub();

const cutExcess = (string, part) => string.replace(`projects/${PROJECT_ID}/${part}/`, '');

const getAllTopicsArray = async () => {
  const [topics] = await pubsub.getTopics();
  return topics.map((item) => cutExcess(item.name, 'topics'));
};

const getAllSubscriptions = async (filter) => {
  let [response] = await pubsub.getSubscriptions();
  switch (filter) {
    case 'deletedTopics':
      response = response.filter((item) => item.metadata.topic === '_deleted-topic_');
      break;
    case 'aliveTopics':
      response = response.filter((item) => item.metadata.topic !== '_deleted-topic_');
      break;
    default: break;
  }
  return response.map((item) => cutExcess(item.name, 'subscriptions'));
};

module.exports = { cutExcess, getAllTopicsArray, getAllSubscriptions };
