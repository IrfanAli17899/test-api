const { DNS } = require('@google-cloud/dns');

const dns = new DNS();

/**
 * Endpoint: /api/dns/
 * Method: GET
 * @function
 * @name getZones
 * @return {object}  zones
 */
const getZones = async (req, res, next) => {
  try {
    const [zones] = await dns.getZones();

    res.send({
      success: true,
      data: zones,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Endpoint: /api/dns/
 * Method: POST
 * @function
 * @name createZone
 * @body  {string} dnsName
 * @body  {string} description
 * @body  {string} zone
 * @return {object}  zone
 */
const createZone = async (req, res, next) => {
  try {
    const { dnsName, description, zone } = req.body;
    const config = {
      dnsName,
      description,
    };
    const response = await dns.createZone(zone, config);

    res.send({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Endpoint: /api/dns/:zoneId
 * Method: DELETE
 * @function
 * @name deleteZone
 * @return {object}  response
 */
const deleteZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const zone = dns.zone(zoneId);
    const response = await zone.delete();

    res.send({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Endpoint: /api/dns/:zoneId
 * Method: GET
 * @function
 * @name getZoneId
 * @params zoneId
 * @return {object}  zone
 */
const getZoneId = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const zone = dns.zone(zoneId);
    const response = await zone.getRecords();

    res.send({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Endpoint: /api/dns/record/add
 * Method: POST
 * @function
 * @name createRecord
 * @body  {string} zoneId
 * @body  {string} dnsName
 * @body  {string} ip
 * @body  {string} recordType
 * @return {object}  zone
 */
const createRecord = async (req, res, next) => {
  try {
    const {
      zoneId, dnsName, ip, recordType,
    } = req.body;
    const zone = dns.zone(zoneId);

    const newARecord = zone.record(recordType, {
      name: dnsName,
      data: ip,
      ttl: 86400,
    });
    const config = {
      add: newARecord,
    };
    const response = await zone.createChange(config);

    res.send({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Endpoint: /api/dns/record
 * Method: DELETE
 * @function
 * @name deleteRecord
 * @body  {string} zoneId
 * @body  {string} dnsName
 * @body  {string} ip
 * @body  {string} recordType
 * @return {object}  response
 */
const deleteRecord = async (req, res, next) => {
  try {
    const {
      zoneId, dnsName, ip, recordType,
    } = req.body;
    const config = {
      name: dnsName,
      data: ip,
      ttl: 86400,
    };
    const zone = dns.zone(zoneId);
    const oldARecord = zone.record(recordType, config);

    const response = await zone.deleteRecords(oldARecord);

    res.send({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getZones,
  createZone,
  getZoneId,
  deleteZone,
  createRecord,
  deleteRecord,
};
