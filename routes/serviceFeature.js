const { Router } = require('express');

const router = Router();
const { featureValidator } = require('../helpers/validators');
const { serviceFeatureApi } = require('../api');

router
  .post('/getall', serviceFeatureApi.getFeatureOfService);

router.use('/', featureValidator.keysValidator);
router.post('/', serviceFeatureApi.addFeatureInService);
router.delete('/', serviceFeatureApi.deleteFeatureFromService);

module.exports = router;
