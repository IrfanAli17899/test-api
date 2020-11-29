const express = require('express');

const router = express.Router();
const {
  notification: {
    getUsersNotifications,
    subscribe,
    unsubscribe,
  },
} = require('../api');

router.get('/', getUsersNotifications);
router.post('/', subscribe);
router.delete('/', unsubscribe);

module.exports = router;
