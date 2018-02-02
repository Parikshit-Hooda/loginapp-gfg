/**
 * Module dependencies
 */

var _ = require('lodash');
var X_ISO_DATE = require('../X_ISO_DATE.constant');



/**
 * Apply a(nother) `where` filter to `data`
 *
 * @param  { Object[] }  data
 * @param  { Object }    where
 * @return { Object[] }
 */
module.exports = function (data, where, schema) {
  if( !data ) return data;
  schema = schema || {};
  return _.filter(data, function(tuple) {
    return matchSet(tuple, where, undefined, schema);
  });
};






//////////////////////////
///
/// private methods   ||
///                   \/
///
//////////////////////////


// Match a model against each criterion in a criteria query
function matchSet(model, criteria, parentKey, schema) {
  // Null or {} WHERE query always matches everything
  if(!criteria || _.isEqual(criteria, {})) return true;

  // By default, treat entries as AND
  return _.every(criteria, function(criterion, key) {
    return matchItem(model, key, criterion, parentKey, schema);
  });
}


function matchOr(model, disjuncts, schema) {
  var outcomes = [];
  _.each(disjuncts, function(criteria) {
    if(matchSet(model, criteria, undefined, schema)) outcomes.push(true);
  });

  var outcome = outcomes.length > 0 ? true : false;
  return outcome;
}

function matchAnd(model, conjuncts, schema) {
  var outcome = true;
  _.each(conjuncts, function(criteria) {
    if(!matchSet(model, criteria, undefined, schema)) outcome = false;
  });
  return outcome;
}

function matchLike(model, criteria, schema) {
  for(var key in criteria) {
    // Return false if no match is found
    if (!checkLike(model[key], criteria[key], schema)) return false;
  }
  return true;
}

function matchNot(model, criteria, schema) {
  return !matchSet(model, criteria, undefined, schema);
}

function matchItem(model, key, criterion, parentKey, schema) {

  // Handle special attr query
  if (parentKey) {

    if (key === 'equals' || key === '=' || key === 'equal') {
      return matchLiteral(model, parentKey, criterion, compare['='], schema);
    }
    else if (key === 'not' || key === '!') {

      // Check for Not In
      if(Array.isArray(criterion)) {

        var match = false;
        criterion.forEach(function(val) {
          if(compare['='](model[parentKey], val)) {
            match = true;
          }
        });

        return match ? false : true;
      }

      return matchLiteral(model, parentKey, criterion, compare['!'], schema);
    }
    else if (key === 'greaterThan' || key === '>') {
      return matchLiteral(model, parentKey, criterion, compare['>'], schema);
    }
    else if (key === 'greaterThanOrEqual' || key === '>=')  {
      return matchLiteral(model, parentKey, criterion, compare['>='], schema);
    }
    else if (key === 'lessThan' || key === '<')  {
      return matchLiteral(model, parentKey, criterion, compare['<'], schema);
    }
    else if (key === 'lessThanOrEqual' || key === '<=')  {
      return matchLiteral(model, parentKey, criterion, compare['<='], schema);
    }
    else if (key === 'startsWith') return matchLiteral(model, parentKey, criterion, checkStartsWith, schema);
    else if (key === 'endsWith') return matchLiteral(model, parentKey, criterion, checkEndsWith, schema);
    else if (key === 'contains') return matchLiteral(model, parentKey, criterion, checkContains, schema);
    else if (key === 'like') return matchLiteral(model, parentKey, criterion, checkLike, schema);
    else throw new Error ('Invalid query syntax!');
  }
  else if(key.toLowerCase() === 'or') {
    return matchOr(model, criterion, schema);
  } else if(key.toLowerCase() === 'not') {
    return matchNot(model, criterion, schema);
  } else if(key.toLowerCase() === 'and') {
    return matchAnd(model, criterion, schema);
  } else if(key.toLowerCase() === 'like') {
    return matchLike(model, criterion, schema);
  }
  // IN query
  else if(_.isArray(criterion)) {
    return _.some(criterion, function(val) {
      return compare['='](model[key], val);
    });
  }

  // Special attr query
  else if (_.isObject(criterion) && validSubAttrCriteria(criterion)) {
    // Attribute is being checked in a specific way
    return matchSet(model, criterion, key, schema);
  }

  // Otherwise, try a literal match
  else return matchLiteral(model, key, criterion, compare['='], schema);

}

// Comparison fns
var compare = {

  // Equalish
  '=' : function (a,b) {
    var x = normalizeComparison(a,b);
    return x[0] == x[1];
  },

  // Not equalish
  '!' : function (a,b) {
    var x = normalizeComparison(a,b);
    return x[0] != x[1];
  },
  '>' : function (a,b) {
    var x = normalizeComparison(a,b);
    return x[0] > x[1];
  },
  '>=': function (a,b) {
    var x = normalizeComparison(a,b);
    return x[0] >= x[1];
  },
  '<' : function (a,b) {
    var x = normalizeComparison(a,b);
    return x[0] < x[1];
  },
  '<=': function (a,b) {
    var x = normalizeComparison(a,b);
    return x[0] <= x[1];
  }
};

// Prepare two values for comparison
function normalizeComparison(a,b) {

  if(_.isUndefined(a) || a === null) a = '';
  if(_.isUndefined(b) || b === null) b = '';

  if (_.isString(a) && _.isString(b)) {
    a = a.toLowerCase();
    b = b.toLowerCase();
  }

  // If Comparing dates, keep them as dates
  if(_.isDate(a) && _.isDate(b)) {
    return [a.getTime(), b.getTime()];
  }
  // Otherwise convert them to ISO strings
  if (_.isDate(a)) { a = a.toISOString(); }
  if (_.isDate(b)) { b = b.toISOString(); }


  // Stringify for comparisons- except for numbers, null, and undefined
  if (!_.isNumber(a)) {
    a = typeof a.toString !== 'undefined' ? a.toString() : '' + a;
  }
  if (!_.isNumber(b)) {
    b = typeof b.toString !== 'undefined' ? b.toString() : '' + b;
  }

  // If comparing date-like things, treat them like dates
  if (_.isString(a) && _.isString(b) && a.match(X_ISO_DATE) && b.match(X_ISO_DATE)) {
    return ([new Date(a).getTime(), new Date(b).getTime()]);
  }

  return [a,b];
}

// Return whether this criteria is valid as an object inside of an attribute
function validSubAttrCriteria(c) {

  if(!_.isObject(c)) return false;

  var valid = false;
  var validAttributes = [
    'equals', 'not', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual',
    '<', '<=', '!', '>', '>=', 'startsWith', 'endsWith', 'contains', 'like'];

  _.each(validAttributes, function(attr) {
    if(hasOwnProperty(c, attr)) valid = true;
  });

  return valid;
}

// Returns whether this value can be successfully parsed as a finite number
function isNumbery (value) {
  if(_.isDate(value)) return false;
  return Math.pow(+value, 2) > 0;
}

// matchFn => the function that will be run to check for a match between the two literals
function matchLiteral(model, key, criterion, matchFn, schema) {
  var val = _.cloneDeep(model[key]);

  if(schema && schema[key] && schema[key].type) {
    var schemaType = schema[key].type;

    // If the value in the schema is a Date, parse it into an ISO Date sting
    // so that it can be compared.
    if(schemaType === 'date') {
      val = new Date(val).toISOString();
      criterion = new Date(criterion).toISOString();
    }
  }

  // If the criterion are both parsable finite numbers, cast them
  if(isNumbery(criterion) && isNumbery(val)) {
    criterion = +criterion;
    val = +val;
  }

  // ensure the key attr exists in model
  if(!model.hasOwnProperty(key)) return false;
  if(_.isUndefined(criterion)) return false;

  // ensure the key attr matches model attr in model
  if((!matchFn(val,criterion))) {
    return false;
  }

  // Otherwise this is a match
  return true;
}


function checkStartsWith (value, matchString) {
  // console.log('CheCKING startsWith ', value, 'against matchString:', matchString, 'result:',sqlLikeMatch(value, matchString));
  return sqlLikeMatch(value, matchString + '%');
}
function checkEndsWith (value, matchString) {
  return sqlLikeMatch(value, '%' + matchString);
}
function checkContains (value, matchString) {
  return sqlLikeMatch(value, '%' + matchString + '%');
}
function checkLike (value, matchString) {
  // console.log('CheCKING  ', value, 'against matchString:', matchString, 'result:',sqlLikeMatch(value, matchString));
  return sqlLikeMatch(value, matchString);
}

function sqlLikeMatch (value,matchString) {

  if(_.isRegExp(matchString)) {
    // awesome
  } else if(_.isString(matchString)) {
    // Handle escaped percent (%) signs
    matchString = matchString.replace(/%%%/g, '%');

    // Escape regex
    matchString = escapeRegExp(matchString);

    // Replace SQL % match notation with something the ECMA regex parser can handle
    matchString = matchString.replace(/([^%]*)%([^%]*)/g, '$1.*$2');

    // Case insensitive by default
    // TODO: make this overridable
    var modifiers = 'i';

    matchString = new RegExp('^' + matchString + '$', modifiers);
  }
  // Unexpected match string!
  else {
    console.error('matchString:');
    console.error(matchString);
    throw new Error('Unexpected match string: ' + matchString + ' Please use a regexp or string.');
  }

  // Deal with non-strings
  if(_.isNumber(value)) value = '' + value;
  else if(_.isBoolean(value)) value = value ? 'true' : 'false';
  else if(!_.isString(value)) {
    // Ignore objects, arrays, null, and undefined data for now
    // (and maybe forever)
    return false;
  }

  // Check that criterion attribute and is at least similar to the model's value for that attr
  if(!value.match(matchString)) {
    return false;
  }
  return true;
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}



/**
 * Safer helper for hasOwnProperty checks
 *
 * @param {Object} obj
 * @param {String} prop
 * @return {Boolean}
 * @api public
 */

var hop = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, prop) {
  return hop.call(obj, prop);
}
