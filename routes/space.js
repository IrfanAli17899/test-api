const express = require('express');

const router = express.Router();
const { spaceApi } = require('../api');

router
  .get('/', spaceApi.getSpaces)
  .post('/', spaceApi.createSpace)
  .delete('/', spaceApi.deleteSpace)
  .post('/tags', spaceApi.addTag)
  .delete('/tags', spaceApi.deleteTag)
  .post('/connector', spaceApi.addConnector)
  .delete('/connector', spaceApi.deleteConnector);

module.exports = router;
