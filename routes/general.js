const express = require('express');

const router = express.Router();
const { generalApi } = require('../api');

router.get('/translations', generalApi.translations);

module.exports = router;
