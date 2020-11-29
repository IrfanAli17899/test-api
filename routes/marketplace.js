const express = require('express');

const router = express.Router();
const {
  marketplaceApi: {
    getAllFeatures,
    getPublicServices,
  },
} = require('../api');

router
  .get('/feature', getAllFeatures)
  .get('/service', getPublicServices);

module.exports = router;
