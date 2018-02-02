/**
 * Module dependencies
 */

var _ = require('lodash');
var rttc = require('rttc');



/**
 * Construct an error instance using the specified error definition.
 *
 * @required  {Dictionary} errorDef
 * @optional  {Dictionary} templateData
 * @return {Error}
 */
module.exports = function constructError(errorDef, templateData){

  if ( _.isUndefined(templateData) ) {
    templateData = {};
  }
  try { rttc.validate({}, templateData); }
  catch (e) {
    throw new Error('Usage error: If specified, `templateData` must be a dictionary.');
  }

  // Validate template data
  //
  // In order to do so, we calculate the set of optional keys with no defaults
  // which were left undefined in the provided template data. We also calculate
  // the RTTC exemplar schema, and while we're at it, go ahead and apply the default
  // value for any undefined key in the template data that has a `defaultsTo`
  // in the schema.
  var optionalKeysLeftUndefined = [];
  var exemplarSchema = {};
  _.each(errorDef.inputs||{}, function (def, id){
    exemplarSchema[id] = def.example;
    if ( !def.required && _.isUndefined(templateData[id]) ) {
      if ( !_.isUndefined(def.defaultsTo) ) {
        templateData[id] = def.defaultsTo;
      }
      else {
        optionalKeysLeftUndefined.push(id);
      }
    }
  });

  // Now validate (and mildly coerce as appropriate) template data.
  // Note that we skip validation of optional keys which were also left undefined in the provided template data.
  var typeSchema = rttc.infer(exemplarSchema);
  templateData = rttc.validate(_.omit(typeSchema, optionalKeysLeftUndefined), templateData);

  // Use template data to build error message, or use the default.
  var errorMessage = _.template(errorDef.template)(templateData);

  // Construct error
  var err = new Error(errorMessage);

  // Set the new error's `code` property.
  err.code = errorDef.code;

  return err;

};
