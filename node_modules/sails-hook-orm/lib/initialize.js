/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var async = require('async');
var prompt = require('prompt');
var loadModelsAndCustomAdapters = require('./load-models-and-custom-adapters');
var validateDatastoreConfig = require('./validate-datastore-config');
var validateModelDef = require('./validate-model-def');
var buildWaterlineOntology = require('./build-waterline-ontology');
var loadAdapterFromAppDependencies = require('./load-adapter-from-app-dependencies');



/**
 * `initialize()`
 *
 * Initialize this hook.
 *
 * @required  {Dictionary} hook
 * @required  {SailsApp} sails
 * @required  {Function} done
 */
module.exports = function initialize(hook, sails, done){

  ////////////////////////////////////////////////////////////////////////////
  // NOTE: If a user hook needs to add or modify model definitions,
  // the hook should wait until `hook:orm:loaded`, then reload the original
  // model modules `orm/loadAppModules`. Finally, the ORM should be flushed using
  // `reload()` below.
  ////////////////////////////////////////////////////////////////////////////


  // Now do a number of things, some of them in parallel.
  async.auto({


    // Load model and adapter definitions which are defined in the project.
    // (this is from e.g. `api/models/` and `api/adapters/`--
    //  note that this does NOT include adapters which need to be loaded from the node_modules directory!)
    _loadModelsAndCustomAdapters: function (next) {
      loadModelsAndCustomAdapters(hook, sails, next);
    },


    // Warning!  This feature is undocumented/experimental and may change at any time!
    _mergeInProgrammaticModuleDefs: ['_loadModelsAndCustomAdapters',function (next) {
      _.extend(hook.models, sails.config.orm.moduleDefinitions.models);
      _.extend(hook.adapters, sails.config.orm.moduleDefinitions.adapters);
      return next();
    }],


    // Get an array of datastore identities which are relevant; that is:
    // • referenced by at least one model
    // • -OR- with `forceLoadAdapter` set
    //
    // Note that we do not attempt to validate/normalize model defs or datastore configs here.
    // If model defs or datastore configs cannot be parsed, we simply ignore them.
    _determineRelevantDatastoreIdentities: ['_mergeInProgrammaticModuleDefs', function (next){

      var relevantDatastoreIdentities = [];
      _.each(sails.config.connections, function _eachDatastoreConfig(datastoreConfig, datastoreIdentity) {

        // If the datastore config is not valid, then ignore it.
        if (!_.isObject(datastoreConfig) || !_.isString(datastoreConfig.adapter) || !datastoreConfig.adapter) {
          return;
        }

        // If the datastore config is not in use by any models or app-wide defaults -AND- it does not have
        // the `forceLoadAdapter` flag set to true, then ignore it.
        var isDatastoreInUse = _.any(hook.models, function eachModel(modelDef) {
          // Check for "connection" specified as string.
          if (_.isString(modelDef.connection) && modelDef.connection === datastoreIdentity) {
            return true;
          }
          // Check for "connection" specified as array.
          else if (_.isArray(modelDef.connection) && _.isString(modelDef.connection[0]) && modelDef.connection[0] === datastoreIdentity) {
            return true;
          }
          // Check for `undefined` connection (i.e. indicating that the default should be used)
          else if (_.isUndefined(modelDef.connection)) {
            // If this datastore is the app-wide default (i.e. `sails.config.models.connection`),
            // then if any models have no explicit "connection" property specified, they are therefore
            // using this datastore by default.
            var isDatastoreAppWideDefault = (_.isObject(sails.config.models) && sails.config.models.connection === datastoreIdentity);
            if (isDatastoreAppWideDefault) {
              return true;
            }
          }//</model has no explicit "connection" defined>

          // Otherwise, this model has something weird going on for its `connection` property,
          else {
            // ...so we just ignore it silently.
          }
        });

        // If the datastore is not in use, and it is does not have the `forceLoadAdapter`
        // config enabled, then it is not relevant.
        if (!isDatastoreInUse && !datastoreConfig.forceLoadAdapter) {
          return;
        }

        // Now, if we made it here, then we know this datastore is relevant.
        relevantDatastoreIdentities.push(datastoreIdentity);
      });
      return next(null, relevantDatastoreIdentities);
    }],



    //  ╦  ╔═╗╔═╗╔╦╗  ╔═╗╔╦╗╔═╗╔═╗╔╦╗╔═╗╦═╗┌─┐
    //  ║  ║ ║╠═╣ ║║  ╠═╣ ║║╠═╣╠═╝ ║ ║╣ ╠╦╝└─┐
    //  ╩═╝╚═╝╩ ╩═╩╝  ╩ ╩═╩╝╩ ╩╩   ╩ ╚═╝╩╚═└─┘
    //  ┌─  ┌─┐┬─┐┌─┐┌┬┐  ┌─┐┌─┐┌─┐  ┌┐┌┌─┐┌┬┐┌─┐    ┌┬┐┌─┐┌┬┐┬ ┬┬  ┌─┐┌─┐  ┌─┐┌─┐┬  ┌┬┐┌─┐┬─┐  ─┐
    //  │───├┤ ├┬┘│ ││││  ├─┤├─┘├─┘  ││││ │ ││├┤     ││││ │ │││ ││  ├┤ └─┐  ├┤ │ ││   ││├┤ ├┬┘───│
    //  └─  └  ┴└─└─┘┴ ┴  ┴ ┴┴  ┴    ┘└┘└─┘─┴┘└─┘────┴ ┴└─┘─┴┘└─┘┴─┘└─┘└─┘  └  └─┘┴─┘─┴┘└─┘┴└─  ─┘
    //
    // For every valid datastore config which is relevant (i.e. referenced by at least one model, or app-wide defaults, or with `forceLoadAdapter` set)
    // ensure its referenced adapter is loaded. Note that we do not attempt to validate/normalize stuff here-- the goal is just to ensure we
    // have the referenced adapters.
    //
    // If we find a not-yet-loaded adapter being referenced from an in-use datastore, then attempt to require it from the `node_modules/`
    // directory of this Sails application.
    _attemptToLoadUnrecognizedAdapters: ['_determineRelevantDatastoreIdentities', function (next, async_data){

      try {
        _.each(async_data._determineRelevantDatastoreIdentities, function _eachRelevantDatastoreIdentity(datastoreIdentity) {

          // Now, if we made it here, then we're ready to take a look at this datastore config and check up on its adapter.
          var datastoreConfig = sails.config.connections[datastoreIdentity];

          // Check if the referenced adapter has aready been loaded one way or another.
          if (_.isObject(datastoreConfig) && _.isString(datastoreConfig.adapter)) {
            var referencedAdapter = hook.adapters[datastoreConfig.adapter];
            if (!referencedAdapter) {
              // If it hasn't, we'll try and load it as a dependency from the app's `node_modules/` folder,
              // and also validate and normalize it.
              hook.adapters[datastoreConfig.adapter] = loadAdapterFromAppDependencies(datastoreConfig.adapter, datastoreIdentity, sails);
            }
          }
        });
      }
      catch (e) { return next(e); }

      return next();
    }],


    // Expose `hook.datastores`; a dictionary indexed by datastore identity.
    // We only build datastore dictionaries for datastore configs  that are in use by one or more models
    // (or have the `forceLoadAdapter` setting enabled).
    // Also, we validate and normalize their configs first.
    _validateDatastoreConfigsAndBuildAccessors: ['_attemptToLoadUnrecognizedAdapters', function (next, async_data){

      try {

        // Start building `hook.datastores`
        hook.datastores = {};

        // Loop over relevant datastore configs.
        _.each(async_data._determineRelevantDatastoreIdentities, function _eachRelevantDatastoreIdentity(datastoreIdentity) {

          // Validate datastore config.
          var normalizedDatastoreConfig = validateDatastoreConfig(datastoreIdentity, hook, sails);

          // Expose a dictionary on `hook.datastores` for this datastore.
          hook.datastores[datastoreIdentity] = {};

          // Expose a reference to normalized datastore config as `.config`:
          hook.datastores[datastoreIdentity].config = normalizedDatastoreConfig;

          // At this point, we know the adapter is locked and loaded.  Err..and validated.  And normalized.
          // Because we're only dealing with relevant datastores and we've already attempted to load unrecognized adapters.
          // So we expose a reference to the relevant, normalized adapter as `.adapter`.
          hook.datastores[datastoreIdentity].adapter = hook.adapters[normalizedDatastoreConfig.adapter];

          // If relevant adapter exposes a compatible `.driver`, then the datastore also exposes a great deal more.
          if (hook.datastores[datastoreIdentity].adapter.driver) {
            // TODO: validate driver

            // • `.driver` (the entire driver)
            hook.datastores[datastoreIdentity].driver = hook.adapters[datastoreConfig.adapter].driver;

            // • `.manager` (the manager returned from when the driver's `createManager()` method was called)
            // TODO

            // • 3 new methods:
            //   ° `.connect(during)`
            //   ° `.transaction(during)`
            //   ° `.query(radarStatement)`
            //   Each of which return deferred objects which can be used as such:
            //   ```
            //   .meta(metadata) // optional
            //   .usingConnection(dbConnection) // optional
            //   .exec(afterwards)
            //   ```
            // TODO
          }

        });
      }
      catch (e) { return next(e); }

      return next();
    }],



    // Normalize model definitions and merge in defaults from `sails.config.models.*`.
    // This is what will be passed in to Waterline when building the ontology.
    _normalizeModelDefs: ['_validateDatastoreConfigsAndBuildAccessors', function (next) {
      try {
        _.each(_.keys(hook.models), function (identity) {
          var originalModelDef = hook.models[identity];
          var normalizedModelDef = validateModelDef(hook.models[identity], identity, hook, sails);
          // Note: prior to March 2016, the normalized def was merged back into
          // the original model def rather than replacing it.
          hook.models[identity] = normalizedModelDef;
        });
      }
      catch (e) { return next(e); }
      return next();
    }],



    //  ╔═╗╦═╗╔═╗╔╦╗╦ ╦╔═╗╔╦╗╦╔═╗╔╗╔  ╔═╗╦ ╦╔═╗╔═╗╦╔═
    //  ╠═╝╠╦╝║ ║ ║║║ ║║   ║ ║║ ║║║║  ║  ╠═╣║╣ ║  ╠╩╗
    //  ╩  ╩╚═╚═╝═╩╝╚═╝╚═╝ ╩ ╩╚═╝╝╚╝  ╚═╝╩ ╩╚═╝╚═╝╩ ╩
    //  ┌─  ┬ ┬┌─┐┬─┐┌┐┌┬┌┐┌┌─┐┌─┐   ─┐
    //  │───│││├─┤├┬┘││││││││ ┬└─┐ ───│
    //  └─  └┴┘┴ ┴┴└─┘└┘┴┘└┘└─┘└─┘   ─┘
    //
    // If NODE_ENV is "production", check if any models are using
    // a datastore running on `sails-disk`.  If so, show a warning.
    _productionCheck: ['_normalizeModelDefs', function (next) {
      try {

        // We use `process.env.NODE_ENV` instead of `sails.config.environment`
        // to allow for the environment to be set to e.g. "staging" while the
        // NODE_ENV is set to "production".
        if (process.env.NODE_ENV === 'production') {
          // > **Remember:**
          // > In a production environment, regardless of your logical `environment`
          // > config, the NODE_ENV environment variable should be set.  Setting
          // > `sails.config.environment` to production does this automatically.

          // e.g. ['localDiskDb', 'foobar']
          var datastoresUsingSailsDisk = _.reduce(sails.config.connections, function(memo, datastoreConf, identity){
            if (datastoreConf.adapter === 'sails-disk') {
              memo.push(identity);
            }
            return memo;
          }, []);

          // e.g. ['user', 'product']
          var modelsUsingSailsDisk = _.reduce(hook.models, function(memo, normalizedModelDef, identity){

            // Look up the referenced datastore for this model, and then check to see if
            // it matches any of the datastores using the sails-disk adapter.
            var referencedDatastore = normalizedModelDef.connection[0];
            if (_.contains(datastoresUsingSailsDisk, referencedDatastore)) {
              memo.push(identity);
            }
            return memo;
          }, []);

          if (modelsUsingSailsDisk.length > 0) {
            sails.log.warn('The default `sails-disk` adapter is not designed for use as a production database;');
            sails.log.warn('(it stores the entire contents of your database in memory)');
            sails.log.warn('Instead, please use another adapter; e.g. sails-postgresql or sails-mongo.');
            sails.log.warn('For more info, see: http://sailsjs.org/documentation/concepts/deployment');
            sails.log.warn('To hide this warning message, enable `sails.config.orm.skipProductionWarnings`.');
          }
        }
      }
      // Just in case.
      catch (e) {
        return next(e);
      }

      // Otherwise it worked!
      return next();
    }],

    // Before continuing any further to actually start up the ORM,
    // check the migrate settings for each model to prompt the user
    // to make a decision if no migrate configuration is present.
    //
    // Note that, if this is a production environment, the `migrate`
    // setting will always be forced to "safe" in Waterline.
    _doubleCheckMigration: ['_productionCheck', function (next) {

      // If there are no models, we're good.
      if (_.keys(hook.models).length === 0) {
        return next();
      }

      // If a project-wide migrate setting (sails.config.models.migrate) is defined, we're good.
      if (typeof sails.config.models.migrate !== 'undefined') {
        return next();
      }

      // If this is a production NODE_ENV, show a slightly different message and skip the prompt.
      if (process.env.NODE_ENV === 'production') {
        console.log('');
        sails.log.info('A project-wide `sails.config.models.migrate` setting has not been configured for this app.');
        sails.log.info('Since the NODE_ENV env variable is set to "production", auto-migration will be disabled automatically.');
        sails.log.info('(i.e. `migrate: \'safe\'`)');
        return next();
      }

      // Otherwise show a prompt
      console.log('-----------------------------------------------------------------');
      console.log();
      prompt.start();
      console.log('',
        'Excuse my interruption, but it looks like this app'+'\n',
        'does not have a project-wide "migrate" setting configured yet.'+'\n',
        '(perhaps this is the first time you\'re lifting it with models?)'+'\n',
        '\n',
        'In short, this setting controls whether/how Sails will attempt to automatically'+'\n',
        'rebuild the tables/collections/sets/etc. in your database schema.\n',
        'You can read more about the "migrate" setting here:'+'\n',
        'http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html?q=migrate\n'
        // 'command(⌘)+click to open links in the terminal'
      );
      console.log('',
        'In a production environment (NODE_ENV==="production") Sails always uses'+'\n',
        'migrate:"safe" to protect inadvertent deletion of your data.\n',
        'However during development, you have a few other options for convenience:'+'\n\n',
        '1. safe  - never auto-migrate my database(s). I will do it myself (by hand)','\n',
        '2. alter - auto-migrate, but attempt to keep my existing data (experimental)\n',
        '3. drop  - wipe/drop ALL my data and rebuild models every time I lift Sails\n'
      );
      console.log('What would you like Sails to do?');
      console.log();
      sails.log.info('To skip this prompt in the future, set `sails.config.models.migrate`.');
      sails.log.info('Usually this is done in a config file (e.g. `config/models.js`),');
      sails.log.info('or as an override (e.g. `sails lift --models.migrate=\'alter\').');
      console.log();
      sails.log.warn('** DO NOT CHOOSE "2" or "3" IF YOU ARE WORKING WITH PRODUCTION DATA **');
      console.log();
      prompt.get(['?'], function(err, result) {
        if (err) { return next(err); }
        result = result['?'];

        switch (result) {
          case 'alter':
          case '2':
            sails.config.models.migrate = 'alter';
            break;
          case 'drop':
          case '3':
            sails.config.models.migrate = 'drop';
            break;
          default:
            sails.config.models.migrate = 'safe';
            break;
        }

        console.log();
        console.log(' Temporarily using `sails.config.models.migrate="%s"...', sails.config.models.migrate);
        console.log(' (press CTRL+C to cancel-- continuing lift automatically in 0.5 seconds...)');
        console.log();
        setTimeout(function (){
          return next();
        },600);
      });

    }],

    // Once all user model and adapter definitions are loaded
    // and normalized, go ahead and initialize the ORM.
    _buildOntology: ['_doubleCheckMigration', function (next, async_data) {
      // If `sails` is already exiting due to previous errors, bail out.
      if (sails._exiting) {
        // This is possible since we are doing asynchronous things in the initialize function,
        // and e.g. another hook may have failed to load in the mean time since we began initializing.
        // Also note that `reload()` below calls initialize again, so this could happen during that
        // process as well.
        return next(new Error('SAILS EXITING'));
      }

      buildWaterlineOntology(hook, sails, function (err, freshOntology) {
        if (err) { return next(err); }

        // Finally, continue onward, passing the ontology through as async_data.
        return next(null, freshOntology);
      });
    }],


    // Now take each of the "collection" instances returned by Waterline and modify them a bit for Sails.
    // Then stuff them back onto `hook.models`.
    _augmentAndExposeFinalModels: ['_buildOntology', function (next, async_data){

      try {
        _.each(async_data._buildOntology.collections, function _eachInstantiatedModel(wlModel, modelIdentity) {

          // Bind context (`this`) for models.
          // (this allows `this` to be used in custom model methods)
          _.bindAll(wlModel);

          // Expose a `.datastore` on this model which includes a reference to the relevant datastore dictionary
          // in `hook.datastores`.
          if (wlModel.datastore) {
            throw new Error('Consistency violation: Instantiated Waterline model already has a `datastore` property.');
          }
          else {
            wlModel.datastore = hook.datastores[wlModel.connection[0]];
          }

          // Derive information about this model's associations from its schema
          // and attach/expose the metadata as `SomeModel.associations` (an array)
          wlModel.associations = _.reduce(wlModel.attributes, function _eachAttribute(memo, attrDef, attrName) {
            // Skip non-associations.
            if (!_.isObject(attrDef) || (!attrDef.model && !attrDef.collection)) {
              return memo;
            }

            // Build an informational dictionary describing this association.
            var assocInfo = { alias: attrName };
            if (attrDef.model) {
              assocInfo.type = 'model';
              assocInfo.model = attrDef.model;
            }
            else if (attrDef.collection) {
              assocInfo.type = 'collection';
              assocInfo.collection = attrDef.collection;
              if (attrDef.via) {
                assocInfo.via = attrDef.via;
              }
            }
            memo.push(assocInfo);
            return memo;
          }, []);

          // Set `hook.models.*` reference to our instantiated model.
          // Exposed as `hook.models[modelIdentity]`.
          hook.models[modelIdentity] = wlModel;

          // If configured to do so (based on `sails.config.globals.models`), then expose a reference
          // to this model as a global variable (based on its `globalId`).
          if (_.isObject(sails.config.globals) && sails.config.globals.models === true) {
            if (_.isString(hook.models[modelIdentity].globalId)) {
              global[hook.models[modelIdentity].globalId] = wlModel;
            }
            // If there is no `globalId`, fall back to the identity.
            // This is for backwards compatibility-- nowadays, Waterline
            // takes care of this automatically:
            else {
              global[modelIdentity] = wlModel;
            }
          }
        });//</each collection from Waterline>
      }//</try>
      catch (e) { return next(e); }

      return next();
    }],


  }, done);//</async.auto>
};
