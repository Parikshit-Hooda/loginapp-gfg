/**
 * Module dependencies
 */

var path = require('path');
var _ = require('lodash');
var unrecognizedDatastoreError = require('../constants/unrecognized-datastore.error');
var invalidDatastoreError = require('../constants/invalid-datastore.error');
var constructError = require('./construct-error');


/**
 * validateDatastoreConfig()
 *
 * Normalize and validate the provided datastore (fka "connection") configuration.
 *
 * @required {String}  datastoreIdentity [f.k.a. "connection" identity]
 * @required {Dictionary} hook
 * @required {SailsApp} sails
 *
 * @returns {Dictionary} [datastore/connection]
 * @throws {Error} E_ADAPTER_NOT_COMPATIBLE
 * @throws {Error} E_ADAPTER_NOT_INSTALLED
 * @throws {Error} E_COULD_NOT_LOAD_ADAPTER
 * @throws {Error} E_UNRECOGNIZED_DATASTORE
 * @throws {Error} E_INVALID_DATASTORE
 */

module.exports = function validateDatastoreConfig(datastoreIdentity, hook, sails){

  //  ╔═╗╔═╗╦═╗╔═╗╔═╗╦═╗╔╦╗  ╔╗ ╔═╗╔═╗╦╔═╗  ╦  ╦╔═╗╦  ╦╔╦╗╔═╗╔╦╗╦╔═╗╔╗╔
  //  ╠═╝║╣ ╠╦╝╠╣ ║ ║╠╦╝║║║  ╠╩╗╠═╣╚═╗║║    ╚╗╔╝╠═╣║  ║ ║║╠═╣ ║ ║║ ║║║║
  //  ╩  ╚═╝╩╚═╚  ╚═╝╩╚═╩ ╩  ╚═╝╩ ╩╚═╝╩╚═╝   ╚╝ ╩ ╩╩═╝╩═╩╝╩ ╩ ╩ ╩╚═╝╝╚╝
  //  ┌─  ┌─┐┌─┐  ┌┬┐┌─┐┌┬┐┌─┐┌─┐┌┬┐┌─┐┬─┐┌─┐  ┌─┐┌─┐┌┐┌┌─┐┬┌─┐  ─┐
  //  │───│ │├┤    ││├─┤ │ ├─┤└─┐ │ │ │├┬┘├┤   │  │ ││││├┤ ││ ┬───│
  //  └─  └─┘└    ─┴┘┴ ┴ ┴ ┴ ┴└─┘ ┴ └─┘┴└─└─┘  └─┘└─┘┘└┘└  ┴└─┘  ─┘

  // If the specified datastore configuration has not been specified, then throw a fatal error.
  var datastoreConfig = sails.config.connections[datastoreIdentity];
  if (!datastoreConfig) {
    throw constructError(unrecognizedDatastoreError, {
      datastoreIdentity: datastoreIdentity
    });
  }

  // The `adapter` property of the datastore config is usually the package name of an adapter,
  // but it also sometimes might be the adapter's identity (for custom adapters).
  var adapterIdentity = datastoreConfig.adapter;

  // Adapter is required for a datastore.
  if (!adapterIdentity) {
    // Invalid datastore found; throw fatal error.
    throw constructError(invalidDatastoreError, {
      datastoreIdentity: datastoreIdentity
    });
  }



  //  ╔╗╔╔═╗╦═╗╔╦╗╔═╗╦  ╦╔═╗╔═╗  ┌┬┐┌─┐┌┬┐┌─┐┌─┐┌┬┐┌─┐┬─┐┌─┐  ┌─┐┌─┐┌┐┌┌─┐┬┌─┐
  //  ║║║║ ║╠╦╝║║║╠═╣║  ║╔═╝║╣    ││├─┤ │ ├─┤└─┐ │ │ │├┬┘├┤   │  │ ││││├┤ ││ ┬
  //  ╝╚╝╚═╝╩╚═╩ ╩╩ ╩╩═╝╩╚═╝╚═╝  ─┴┘┴ ┴ ┴ ┴ ┴└─┘ ┴ └─┘┴└─└─┘  └─┘└─┘┘└┘└  ┴└─┘

  // Now build our normalized datastore config to return.
  var normalizedDatastoreConfig = {};

  // Adapters can provide a `defaults` dictionary which serves as a set of default properties for datastore config.
  // If an adapter exists for this datastore, we know it has already been validated; so we can safely use that as
  // the basis for our normalized datastore configuration. (note: this step may eventually supported by Waterline core,
  // in which case it could be removed here)
  if (hook.adapters[adapterIdentity]) {
    _.extend(normalizedDatastoreConfig, hook.adapters[adapterIdentity].defaults);
  }

  // Either way, then merge in the the app-level datastore configuration.
  _.extend(normalizedDatastoreConfig, datastoreConfig);


  // Success- datastore has been normalized and validated.
  // (any missing adapters were ignored)
  return normalizedDatastoreConfig;
};
