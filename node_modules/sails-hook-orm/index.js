/**
 * Module dependencies
 */

var util = require('util');
var async = require('async');
var initialize = require('./lib/initialize');
var reload = require('./lib/reload');
var teardown = require('./lib/teardown');



/**
 * ORM hook
 *
 * @param  {SailsApp} sails
 * @return {Dictionary} [hook definition]
 */
module.exports = function (sails) {

  /**
   * Build the hook definition.
   * (this is returned below)
   *
   * @type {Dictionary}
   */
  return {


    /**
     * defaults
     *
     * The implicit configuration defaults merged into `sails.config` by this hook.
     *
     * @type {Dictionary}
     */
    defaults: {

      globals: {
        adapters: true,
        models: true
      },


      // Default model/adapter definitions to automatically attach
      // to `sails.hooks.orm.adapters` and/or `sails.hooks.orm.models`.
      orm: {

        // By default, relevant warnings are shown when NODE_ENV is "production".
        skipProductionWarnings: false,

        //================================================================
        // Experimental
        // (may change at any time!)
        //================================================================
        moduleDefinitions: {
          models: {},
          adapters: {},
        }
        //================================================================

      },


      // Default model properties
      models: {

        // This default connection (i.e. datasource) for the app
        // will be used for each model unless otherwise specified.
        connection: 'localDiskDb'
      },


      // Connections to data sources, web services, and external APIs.
      // Can be attached to models and/or accessed directly.
      connections: {

        // Built-in disk persistence
        // (by default, creates the file: `.tmp/localDiskDb.db`)
        localDiskDb: {
          adapter: 'sails-disk'
        }
      }
    },



    /**
     * configure()
     *
     * @type {Function}
     */
    configure: function() {

      // Ensure `hook.models` exists, at least as an empty dictionary, very early
      // in the loading process (i.e. before `initialize()` is called).
      //
      // (This particular timing-- before initialize()-- is for backwards compatibility.
      //  Originally it was so that other hooks could mix in models/adapters. Note that
      //  this behavior may change in a future version of Sails.)
      if (!sails.hooks.orm.models) {
        sails.hooks.orm.models = {};
        // Expose a reference to `hook.models` as `sails.models`
        sails.models = sails.hooks.orm.models;
      }
      if (!sails.hooks.orm.adapters) {
        sails.hooks.orm.adapters = {};
        // Expose a reference to `hook.adapters` as `sails.adapters`
        sails.adapters = sails.hooks.orm.adapters;
      }

      // Listen for reload events
      sails.on('hook:orm:reload', sails.hooks.orm.reload);

      // Listen for lower event, and tear down all of the adapters
      sails.once('lower', sails.hooks.orm.teardown);
    },



    /**
     * initialize()
     *
     * Logic to run when this hook loads.
     */
    initialize: function (next) {
      // console.log('>>>>>> sails.hooks.orm.initialize() called.');
      // var _ = require('lodash');
      // console.log(
      //   'Currently there are %d models, %d datastores, and %d adapters:',
      //   _.keys(sails.hooks.orm.models).length,
      //   _.keys(sails.hooks.orm.datastores).length,
      //   _.keys(sails.hooks.orm.adapters).length,
      //   _.keys(sails.hooks.orm.models),
      //   _.keys(sails.hooks.orm.datastores),
      //   _.keys(sails.hooks.orm.adapters)
      // );
      return initialize(sails.hooks.orm, sails, next);
    },



    /**
     * sails.hooks.orm.reload()
     */
    reload: function (next) {
      return reload(sails.hooks.orm, sails, next);
    },



    /**
     * sails.hooks.orm.teardown()
     */
    teardown: function (next) {
      // console.log('>>>>>> sails.hooks.orm.teardown() called.');
      return teardown(sails.hooks.orm, sails, next);
    }


  };
};
