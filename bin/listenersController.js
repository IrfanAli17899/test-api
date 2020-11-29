const _ = require('lodash');
const cron = require('cron');
const { fork } = require('child_process');
const { getAllSubscriptions } = require('../helpers/pubsub');

const running = [];
const renewListeners = async () => {
  try {
    console.debug('Running renewer', running.map((item) => item.name));
    const subscriptions = await getAllSubscriptions('aliveTopics');
    running.forEach((runningObj, index) => {
      if (!subscriptions.includes(runningObj.name)) {
        runningObj.child.kill();
        running.splice(index, 1);
      }
    });

    // _.difference -- Creates an array of array values not included in the other given arrays
    const pendingSubscriptions = _.difference(
      subscriptions,
      running.map((item) => item.name),
    );
    pendingSubscriptions.forEach((pendingSubscriptionName) => {
      const child = fork('./helpers/topicConsumer.js', [pendingSubscriptionName]);
      child.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
      child.on('error', (data) => {
        console.error(`stderr: ${data}`);
      });
      child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
      });
      running.push({ child, name: pendingSubscriptionName });
    });
    console.log(process.memoryUsage());
  } catch (err) {
    console.log(err);
  }
};

const renewListenersJob = {
  cronTime: '*/5 * * * *',
  onTick: renewListeners,
};

const renewer = new cron.CronJob(renewListenersJob);
renewer.start();
console.log('Renewer cron started');
