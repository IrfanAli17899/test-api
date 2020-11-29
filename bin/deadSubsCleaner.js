const cron = require('cron');
const { PubSub } = require('@google-cloud/pubsub');
const { pubsub: { getAllSubscriptions } } = require('../helpers');

const pubsub = new PubSub();
const renewListeners = async () => {
  try {
    console.debug('Running cleaner');
    const subscriptions = await getAllSubscriptions('deletedTopics');
    await Promise.all(subscriptions.map((name) => pubsub.subscription(name).delete()));
    console.log('Successfully cleaned these subscriptions', subscriptions);
  } catch (err) {
    console.log(err);
  }
};

const renewListenersJob = {
  cronTime: '0 0 * * *',
  onTick: renewListeners,
};

const renewer = new cron.CronJob(renewListenersJob);
renewer.start();
