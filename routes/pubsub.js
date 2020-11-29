const express = require('express');
const {
  envValidator: {
    cloudbuildEnvValidator,
  },
} = require('../helpers/validators');

const router = express.Router();
const {
  pubsubApi: {
    createSubscription,
    createTopic,
    getAllTopics,
    getSubscriptionsByTopic,
    publishMessage,
    deleteTopic,
    // deleteSubscription,
    getSubscriptions,
  },
} = require('../api');

router.use('/', cloudbuildEnvValidator);

// router.get('/subscriptions', getSubscriptions);
// router.get('/subscriptionsByTopic', getSubscriptionsByTopic);
// router.post('/subscription', createSubscription);
// // router.delete("/subscription", deleteSubscription);

// router.get('/topic', getAllTopics);
// router.post('/topic', createTopic);
// router.delete('/topic', deleteTopic);

router.post('/message', publishMessage);

module.exports = router;
