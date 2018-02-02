/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var modelHasNoDatastoreError = require('../constants/model-has-no-datastore.error');
var modelHasMultipleDatastoresError = require('../constants/model-has-multiple-datastores.error');
var constructError = require('./construct-error');




/**
 * validateModelDef()
 *
 * Validate, normalize, and mix in implicit defaults for a particular model
 * definition.  Includes adjustments for backwards compatibility.
 *
 * @required {Dictionary} originalModelDef
 * @required {String} modelIdentity
 * @required {Dictionary} hook
 * @required {SailsApp} sails
 *
 * @returns {Dictionary} [normalized model definition]
 * @throws {Error} E_MODEL_HAS_MULTIPLE_DATASTORES
 * @throws {Error} E_MODEL_HAS_NO_DATASTORE
 */

module.exports = function validateModelDef (originalModelDef, modelIdentity, hook, sails) {

  // Rebuild model definition to provide a layer of insulation against any
  // changes that might tamper with the original, raw definition.
  //
  // Model settings are determined using the following rules:
  // (in descending order of precedence)
  // • explicit model def
  // • sails.config.models
  // • implicit framework defaults
  var normalizedModelDef;

  // We start off with some implicit defaults:
  normalizedModelDef = {
    // Set `identity` so it is available on the model itself.
    identity: modelIdentity,
    // Default the table name to the identity.
    tableName: modelIdentity,
    // Default attributes to an empty dictionary (`{}`).
    // > Note that we handle merging attributes as a special case below
    // > (i.e. because we're doing a shallow `.extend()` rather than a deep merge)
    // > This allows app-wide defaults to include attributes that will be shared across
    // > all models.
    attributes: {}
  };

  // Next, merge in app-wide defaults.
  _.extend(normalizedModelDef, _.omit(sails.config.models, ['attributes']));
  // Merge in attributes from app-wide defaults, if there are any.
  if (!_.isFunction(sails.config.models.attributes) && !_.isArray(sails.config.models.attributes) && _.isObject(sails.config.models.attributes)) {
    normalizedModelDef.attributes = _.extend(normalizedModelDef.attributes, sails.config.models.attributes);
  }

  // Finally, fold in the original properties provided in the userland model definition.
  _.extend(normalizedModelDef, _.omit(originalModelDef, ['attributes']));
  // Merge in attributes from the original model def, if there are any.
  if (!_.isFunction(originalModelDef.attributes) && !_.isArray(originalModelDef.attributes) && _.isObject(originalModelDef.attributes)) {
    normalizedModelDef.attributes = _.extend(normalizedModelDef.attributes, originalModelDef.attributes);
  }


  // If this is production, force `migrate: safe`!!
  // (note that we check `sails.config.environment` and process.env.NODE_ENV
  //  just to be on the conservative side)
  if ( normalizedModelDef.migrate !== 'safe' && (sails.config.environment === 'production' || process.env.NODE_ENV === 'production')) {
    normalizedModelDef.migrate = 'safe';
    sails.log.verbose('For `%s` model, forcing Waterline to use `migrate: "safe" strategy (since this is production)', modelIdentity);
  }



  // Now that we have a normalized model definition, verify that a valid datastore setting is present:
  // (note that much of the stuff below about arrays is for backwards-compatibility)

  // If a datastore is not configured in our normalized model def (i.e. it is falsy or an empty array), then we throw a fatal error.
  if (!normalizedModelDef.connection || _.isEqual(normalizedModelDef.connection, [])) {
    throw constructError(modelHasNoDatastoreError, { modelIdentity: modelIdentity });
  }
  // Coerce `Model.connection` to an array.
  // (note that future versions of Sails may skip this step and keep it as a string instead of an array)
  if (!_.isArray(normalizedModelDef.connection)) {
    normalizedModelDef.connection = [
      normalizedModelDef.connection
    ];
  }
  // Explicitly prevent more than one datastore from being used.
  if (normalizedModelDef.connection.length > 1) {
    throw constructError(modelHasMultipleDatastoresError, { modelIdentity: modelIdentity });
  }

  // Grab the normalized configuration for the datastore referenced by this model.
  // If the normalized model def doesn't have a `schema` flag, then check out its
  // normalized datastore config to see if _it_ has a `schema` setting.
  //
  // > Usually this is a default coming from the adapter itself-- for example,
  // > `sails-mongo` and `sails-disk` set `schema: false` by default, whereas
  // > `sails-mysql` and `sails-postgresql` default to `schema: true`.
  // > See `lib/validate-datastore-config.js` to see how that stuff gets in there.
  var referencedDatastore = hook.datastores[normalizedModelDef.connection[0]];
  if (!_.isObject(referencedDatastore)) {
    throw new Error('Consistency violation: A model (`'+modelIdentity+'`) references a datastore which cannot be found (`'+normalizedModelDef.connection[0]+'`).  If this model definition has an explicit `connection` property, check that it is spelled correctly.  If not, check your default `connection` (usually located in `config/models.js`).  Finally, check that this connection (`'+normalizedModelDef.connection[0]+'`) is valid as per http://sailsjs.org/documentation/reference/configuration/sails-config-connections.');
  }
  var normalizedDatastoreConfig = referencedDatastore.config;
  if (_.isUndefined(normalizedModelDef.schema)) {
    if (!_.isUndefined(normalizedDatastoreConfig.schema)) {
      normalizedModelDef.schema = normalizedDatastoreConfig.schema;
    }
  }

  // Return the normalized model definition.
  return normalizedModelDef;

};
