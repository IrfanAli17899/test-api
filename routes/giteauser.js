const express = require('express');

const router = express.Router();
const { giteaUserApi } = require('../api');

router.get('/', giteaUserApi.getAllUsers)
  .post('/', giteaUserApi.createUser);

module.exports = router;
