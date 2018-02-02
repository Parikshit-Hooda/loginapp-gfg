/**
 * Module dependencies
 */

var util = require('util');
var _ = require('lodash');
var Waterline = require('waterline');



/**
 * buildWaterlineOntology()
 *
 * Instantiate a Waterline "collection" for each Sails model,
 * then tell Waterline to initialize the ORM and trigger the
 * callback with that fresh new Waterline ontology.
 *
 * @required {Dictionary} hook
 * @required {SailsApp} sails
 * @required {Function}  cb
 *           @param {Error} err
 *           @param {===} freshOntology [a freshly initialized ontology from Waterline]
 */
module.exports = function buildWaterlineOntology(hook, sails, cb) {

  try {

    sails.log.verbose('Starting ORM...');

    // First, instantiate a fresh, empty Waterline ORM instance.
    var freshOntology = new Waterline();

    // Next, iterate through each normalized model definition and register it with Waterline
    // (using the `loadCollection()` method).
    _.each(hook.models, function _loadEachModelDefIntoWaterline(normalizedModelDef, identity) {
      // Create a Waterline "Collection" instance for each model, then register it w/ the ORM.
      sails.log.silly('Registering model `%s` in Waterline (ORM)', identity);
      freshOntology.loadCollection(Waterline.Collection.extend(normalizedModelDef));
    });


    // Now, tell Waterline to initialize the ORM by calling its `.initialize()` method.
    // This performs tasks like interpretating the physical-layer schema, validating associations,
    // hooking up models to their datastores (fka "connections"), and performing auto-migrations.
    freshOntology.initialize({

      // Pass in the app's known adapters.
      adapters: hook.adapters,


      // We build and pass in a dictionary of normalized datastore configurations (fka connections)
      // which _are actually in use_ (this is to avoid unnecessary work in Waterline).
      connections: (function (){
        var normalizedDatastoreConfigs = _.reduce(hook.datastores, function _eachDatastore(memo, datastore, datastoreIdentity) {
          memo[datastoreIdentity] = datastore.config;
          return memo;
        }, {});
        // console.log('BUILDING ONTOLOGY USING CONNECTIONS:',normalizedDatastoreConfigs);
        // e.g.
        // BUILDING ONTOLOGY USING CONNECTIONS:
        // { localDiskDb: { schema: false, filePath: '.tmp/', adapter: 'sails-disk' } }
        return normalizedDatastoreConfigs;
      })(),


      // ORIGINAL VERSION:
      //
      // example output:
      // ```
      // >>>>>> sails.hooks.orm.initialize() called.
      // BUILDING ONTOLOGY USING CONNECTIONS: { localDiskDb: { adapter: 'sails-disk' } }
      // ```
      //
      // code:
      // ```
      // connections: (function (){
      //   var connectionsInUse = _.reduce(hook.adapters, function (memo, adapter, adapterKey) {
      //     _.each(sails.config.connections, function(connection, connectionKey) {
      //       if (adapterKey === connection.adapter) {
      //         memo[connectionKey] = connection;
      //       }
      //     });
      //     return memo;
      //   }, {});
      //   console.log('BUILDING ONTOLOGY USING CONNECTIONS:',connectionsInUse);
      //   return connectionsInUse;
      // })(),
      // ```



      // `defaults` are a set of default properties for every model definition.
      // They are defined in `sails.config.models`.
      // Note that the ORM hook takes care of this to some degree, but we also pass them in here.
      // This may change in future versions of Sails.
      defaults: sails.config.models

    }, function _afterInitializingWaterline (err) {
      if (err) { return cb(err); }

      if (_.isFunction(freshOntology.collections) || _.isArray(freshOntology.collections) || !_.isObject(freshOntology.collections)) {
        // Note that prior to March 2016, the second arg of the callback was used instead of relying on the existing `freshOntology` we already
        // have instantiated above (however we've always _sent back_ the existing `freshOntology`-- we just used to use the second arg of the callback
        // for the set of collections)
        return cb(new Error('Consistency violation: Expected `collections` property of ontology instance returned from Waterline to be a dictionary.\nInstead, here is what the ontology instance looks like:\n'+(util.inspect(freshOntology,{depth:null}))));
      }

      // Success
      return cb(undefined, freshOntology);
    });
  }
  // Remember: this try/catch only nabs errors which might be thrown during the first tick.
  catch (e) {
    return cb(e);
  }
};
