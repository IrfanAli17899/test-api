const express = require('express');

const router = express.Router();
const { adminApi } = require('../api');

router
  .delete('/spaces', adminApi.deleteAllSpaces);

module.exports = router;
