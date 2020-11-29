const { Router } = require('express');

const router = Router();
const { serviceVersionApi } = require('../api');

router.post('/', serviceVersionApi.createServiceVersion);
router.post('/select', serviceVersionApi.selectActiveVersion);
router.get('/', serviceVersionApi.getServiceVersions);

module.exports = router;
