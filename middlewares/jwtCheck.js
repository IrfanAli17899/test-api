const jwt = require('express-jwt');
const jwks = require('jwks-rsa');
const { AUTH_API_URL } = require('../config');

module.exports = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH_API_URL}/.well-known/jwks.json`,
  }),
  issuer: `https://${AUTH_API_URL}/`,
  algorithms: ['RS256'],
});
