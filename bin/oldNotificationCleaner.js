const cron = require('cron');
const { GQLClient } = require('../libs');
const {
  NOTIFICATION_QUERIES: {
    DELETE_NOTIFICATIONS,
  },
} = require('../libs/queries');

const cleanOldNotificattions = async () => {
  try {
    const { delete_notification: { affected_rows: rows } } = await GQLClient.mutate({
      mutation: DELETE_NOTIFICATIONS,
      variables: {
        now: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    });
    console.log('Deleted old rows', rows);
  } catch (err) {
    console.log(err);
  }
};

const cleanerJob = {
  cronTime: '0 0 * * *',
  onTick: cleanOldNotificattions,
};

const cleaner = new cron.CronJob(cleanerJob);
cleaner.start();
