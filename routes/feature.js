const express = require('express');

const router = express.Router();
const {
  featureApi: {
    getAllFeatures,
    createFeature,
    addTag,
    deleteTag,
  },
} = require('../api');

router
  .post('/tags', addTag)
  .delete('/tags', deleteTag)
  .get('/', getAllFeatures)
  .post('/', createFeature);

module.exports = router;
