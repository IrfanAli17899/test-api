const express = require('express');

const router = express.Router();
const { userApi } = require('../api');

// router.post('/signup', userApi.createUser);
router.get('/', userApi.getUser);
// router.get("/:username", userApi.getUserByUsername);
router.post('/update', userApi.updateUser);

module.exports = router;
