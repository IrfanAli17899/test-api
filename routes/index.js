const { Router } = require('express');

const { userTableMiddleware, jwtCheck } = require('../middlewares');

const privateRouter = Router();
const publicRouter = Router();
// const {
//   userApi: { checkUserToken },
// } = require("../api");

privateRouter.use('/', jwtCheck);
privateRouter.use('/', userTableMiddleware);

// privateRouter.use("/", checkUserToken);
privateRouter.use('/space', require('./space'));
privateRouter.use('/service', require('./service'));
privateRouter.use('/admin', require('./admin'));
privateRouter.use('/service_feature', require('./serviceFeature'));
privateRouter.use('/service_version', require('./serviceVersion'));
privateRouter.use('/gitea/users', require('./giteauser'));
privateRouter.use('/notification', require('./notification'));
privateRouter.use('/team', require('./team'));
privateRouter.use('/pubsub', require('./pubsub'));
privateRouter.use('/marketplace', require('./marketplace'));
privateRouter.use('/feature', require('./feature'));
privateRouter.use('/user', require('./user'));

publicRouter.use('/general', require('./general'));
publicRouter.use('/dns', require('./dns'));
publicRouter.use('/auth', require('./auth'));

module.exports = {
  privateRouter,
  publicRouter,
};
