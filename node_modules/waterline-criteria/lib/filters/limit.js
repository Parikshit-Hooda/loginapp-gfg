/**
 * Module dependencies
 */

var _ = require('lodash')
  , util = require('util');


/**
 * Apply a `limit` modifier to `data` using `limit`.
 *
 * @param  { Object[] }  data
 * @param  { Integer }    limit
 * @return { Object[] }
 */
module.exports = function (data, limit) {
  if( limit === undefined || !data || limit === 0) return data;
  return _.slice(data, 0, limit);
};
