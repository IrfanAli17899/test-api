const express = require('express');

const router = express.Router();
const { dnsApi } = require('../api');

router
  .get('/', dnsApi.getZones)
  .post('/', dnsApi.createZone)
  .delete('/record', dnsApi.deleteRecord)
  .post('/record/add', dnsApi.createRecord)
  .delete('/:zoneId', dnsApi.deleteZone)
  .get('/:zoneId', dnsApi.getZoneId);

module.exports = router;
