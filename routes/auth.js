const express = require('express');

const router = express.Router();
const {
  authApi: {
    login,
    signup,
  },
} = require('../api');

router.post('/login', login);
router.post('/signup', signup);

module.exports = router;
