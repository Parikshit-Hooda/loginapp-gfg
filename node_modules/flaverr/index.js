/**
 * Module dependencies
 */

var util = require('util');
var _ = require('@sailshq/lodash');


/**
 * flaverr()
 *
 * Flavor an Error instance with the specified error code string or dictionary of customizations.
 *
 * Specifically, this modifies the provided Error instance either:
 * (A) by attaching a `code` property and setting it to the specified value (e.g. "E_USAGE"), or
 * (B) merging the specified dictionary of stuff into the Error
 *
 * If a `message` or `name` is provided, the Error instance's `stack` will be recalculated accordingly.
 * This can be used to consume an omen -- i.e. giving this Error instance's stack trace "hindsight",
 * and keeping it from getting "cliffed-out" on the wrong side of asynchronous callbacks.
 *
 * Besides improving the quality of your everyday errors and allowing for exception-based switching,
 * you can also use flaverr to build an _omen_, an Error instance defined ahead of time in order to
 * grab a stack trace. (used for providing a better experience when viewing the stack trace of errors
 * that come from one or more asynchronous ticks down the line; e.g. uniqueness errors.)
 *
 * > The "omen" approach is inspired by the implementation originally devised for Waterline:
 * > https://github.com/balderdashy/waterline/blob/6b1f65e77697c36561a0edd06dff537307986cb7/lib/waterline/utils/query/build-omen.js
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @required {String|Dictionary} codeOrCustomizations
 *           e.g. `"E_USAGE"`
 *                    -OR-
 *                `{ name: 'UsageError', code: 'E_UHOH', machineInstance: foo, errors: [], misc: 'etc' }`
 *
 * @optional {Error?} err
 *           If omitted, a new Error will be instantiated instead.
 *           e.g. `new Error('Invalid usage: That is not where the quarter is supposed to go.')`
 *
 * @optional {Function?} caller
 *        An optional function to use for context (useful for building omens)
 *        The stack trace of the omen will be snipped based on the instruction where
 *        this "caller" function was invoked.
 *
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * @returns {Error}
 *          An Error instance.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */

module.exports = function flaverr (codeOrCustomizations, err, caller){

  if (!_.isUndefined(err) && !_.isError(err)) {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  If specified, expected 2nd argument to be an Error instance (but instead got `'+util.inspect(err, {depth: null})+'`)');
  }

  if (!_.isUndefined(caller) && !_.isFunction(caller)) {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  If specified, expected 3rd argument should be a function that will be used as a stack trace context (but instead got `'+util.inspect(caller, {depth: null})+'`)');
  }


  if (_.isString(codeOrCustomizations)) {
    if (err) {
      err.code = codeOrCustomizations;
    }
    else {
      err = new Error('Code: '+codeOrCustomizations);
      err.name = 'AnonymousError';
    }
  }
  else if (_.isObject(codeOrCustomizations) && !_.isArray(codeOrCustomizations) && !_.isFunction(codeOrCustomizations)) {
    if (codeOrCustomizations.stack) { throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Customizations (dictionary provided as 1st arg) are not allowed to contain a `stack`.'); }

    if (!err){
      if (_.isUndefined(codeOrCustomizations.name)) {
        codeOrCustomizations.name = 'AnonymousError';
      }
      if (_.isUndefined(codeOrCustomizations.message)) {
        codeOrCustomizations.message = util.inspect(codeOrCustomizations, {depth: 5});
      }

      err = new Error(codeOrCustomizations.message);
    }
    else {

      if (codeOrCustomizations.name || codeOrCustomizations.message) {

        if (_.isUndefined(codeOrCustomizations.name)) {
          codeOrCustomizations.name = err.name;
        }
        if (_.isUndefined(codeOrCustomizations.message)) {
          codeOrCustomizations.message = err.message;
        }
        var numCharsToShift = err.name.length + 2 + err.message.length;
        err.stack = codeOrCustomizations.name + ': '+ codeOrCustomizations.message + err.stack.slice(numCharsToShift);
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: Explore a fancier strategy like this (maybe):
        // ```
        // if (omen && omen._traceReference && Error.captureStackTrace) {
        //   var omen2 = new Error(message);
        //   Error.captureStackTrace(omen2, omen._traceReference);
        //   omen2.name = name;
        //   return omen;
        // }
        // ```
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      }//>-

    }//>-

    // Always merge in the customizations, whether this is an existing error or a new one.
    _.extend(err, codeOrCustomizations);

  }
  else {
    throw new Error('Consistency violation: Unexpected usage of `flaverr()`.  Expected 1st argument to be either a string error code or a dictionary of customizations (but instead got `'+util.inspect(codeOrCustomizations, {depth: null})+'`)');
  }


  // If a `caller` reference was provided, then use it to adjust the stack trace.
  // (Note that we silently skip this step if the `Error.captureStackTrace` is missing
  // on the currently-running platform)
  if (caller && Error.captureStackTrace) {
    Error.captureStackTrace(err, caller);
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // FUTURE: do something fancier here, or where this is called, to keep track of the omen so that it
    // can support both sorts of usages (Deferred and explicit callback.)
    //
    // This way, it could do an even better job of reporting exactly where the error came from in
    // userland code as the very first entry in the stack trace.  e.g.
    // ```
    // Error.captureStackTrace(omen, Deferred.prototype.exec);
    // // ^^ but would need to pass through the original omen or something
    // ```
    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  }

  return err;
};



/**
 * getBareTrace()
 *
 * Return the bare stack trace of an Error, with the identifying `name`/colon/space/`message`
 * preamble trimmed off, leaving only the info about stack frames.
 *
 * @param  {Error?} err   [If unspecified, a new Error will be instantiated on the flow and its stack will be used.]
 * @return {String}
 */

module.exports.getBareTrace = function (err){
  if (_.isUndefined(err)){ err = new Error(); }
  if (!_.isError(err)){ throw new Error('Consistency violation: If an argument is supplied to `getBareTrace()`, it must be an Error instance.  Instead, got: '+util.inspect(err, {depth: 5})); }

  var bareTrace = err.stack;
  var numCharsToShift = err.name.length + 2 + err.message.length;
  bareTrace = bareTrace.slice(numCharsToShift);
  bareTrace = bareTrace.replace(/^[\n]+/g,'');
  return bareTrace;
};




