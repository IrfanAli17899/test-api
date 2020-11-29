const { PubSub } = require('@google-cloud/pubsub');
const { GQLClient } = require('../libs');
const {
  NOTIFICATION_QUERIES: {
    INSERT_NOTIFICATION,
  },
} = require('../libs/queries');

const pubsub = new PubSub();

const messageHandler = async (mes) => {
  try {
    const { message, service_id } = JSON.parse(mes.data.toString('utf-8'));
    console.log(`processing body=${message} | service_id=${service_id}`);
    await GQLClient.mutate({
      mutation: INSERT_NOTIFICATION,
      variables: {
        service_id,
        body: JSON.stringify(message),
      },
    });
  } catch (err) {
    console.log('error in listener name=', process.argv[2], err);
  } finally {
    mes.ack();
  }
};

try {
  console.log('listener started for subscription name =', process.argv[2]);
  const subscription = pubsub.subscription(process.argv[2]);
  subscription.on('message', messageHandler);
} catch (err) {
  console.log('error in listener name=', process.argv[2], err);
}
