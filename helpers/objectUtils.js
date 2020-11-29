const omitBy = require('lodash/omitBy');

const omitUndefined = (object) => omitBy(object, (value) => value === undefined);

module.exports = {
  omitUndefined,
};
