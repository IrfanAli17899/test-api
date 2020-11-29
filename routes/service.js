const express = require('express');

const router = express.Router();
const { serviceApi } = require('../api');

router
  .post('/getall', serviceApi.getAllServices)
  .get('/fetch', serviceApi.fetch)
  .post('/', serviceApi.createService)
  .post('/update', serviceApi.updateService)
  .delete('/', serviceApi.deleteService)
  .post('/tags', serviceApi.addTag)
  .delete('/tags', serviceApi.deleteTag)
  .post('/star', serviceApi.starService)
  .delete('/star', serviceApi.unstarService)
  .post('/migrate', serviceApi.repoMigrate)
  .post('/clone', serviceApi.cloneService);

module.exports = router;
