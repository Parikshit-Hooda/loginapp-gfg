/**
 * Module dependencies
 */

// <n/a>


/**
 * reload()
 *
 * Reload ORM hook
 * (which mostly just runs the hook's `initialize()` fn again)
 *
 * @required  {Dictionary} hook
 * @required  {SailsApp} sails
 * @optional {Function} done
 */
module.exports = function reload (hook, sails, done) {
  done = done || function _afterReloadWithNoCbProvided(err) {
    if (err) {
      sails.log.error('Failed to reload ORM hook.  Details:',err);
    }
  };

  // Teardown all of the adapters, since `.initialize()` will restart them.
  hook.teardown(function(err) {
    if (err) { return done(err); }

    // Now run `.initialize()` again.
    hook.initialize(function(err) {
      if (err) {
        var contextualErr = new Error('Failed to reinitialize ORM because the `initialize()` method of the ORM hook returned an error.  \nDetails:\n'+err.stack);
        return done(contextualErr);
      }

      // If the re-initialization was a success, trigger an event in case something
      // needs to respond to the ORM reload (e.g. pubsub hook).
      // Note that, since now there is an optional callback, this event may be deprecated
      // in future versions of Sails.
      sails.emit('hook:orm:reloaded');

      return done();
    });
  });
};
