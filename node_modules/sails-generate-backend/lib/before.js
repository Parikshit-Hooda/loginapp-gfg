/**
 * Module dependencies
 */

var util = require('util');
var crypto = require('crypto');
var _ = require('lodash');
var mergeDefaults = require('merge-defaults');




/**
 * This `before` function is run before generating targets.
 * Validate, configure defaults, get extra dependencies, etc.
 *
 * @param  {Object} scope
 * @param  {Function} cb    [callback]
 */

module.exports = function(scope, cb) {

	//
	// Validate custom scope variables which
	// are required by this generator.
	//
	//
	if ( !scope.rootPath ) {
		return cb(new Error(
			'Missing scope variable: `rootPath`\n' +
			'Please make sure it is specified and try again.'
		));
	}

	//
	// Determine default values based on the
	// available scope.
	//
	mergeDefaults(scope, {
		currentTime: new Date(),
		viewEngine: 'ejs'
	});

	// Determine which views generator to use
	if (scope.viewEngine && scope.viewEngine !== 'ejs') {
		scope.modules['views'] = 'sails-generate-views-'+scope.viewEngine;

		// enable partials and layout for handlebars
		if (scope.viewEngine === 'handlebars') {
			scope.layout = 'layouts/layout';
			scope.partials = 'partials';
		}
	} 
	
	// Only .ejs gets layout
	else {
		scope.layout = 'layout';
	}

	// Create a default session secret
	scope.secret = generateSecret();

	cb();
};

/**
 * Generate session secret
 * @return {[type]} [description]
 */
function generateSecret () {
	
	// Combine random and case-specific factors into a base string
	var factors = {
		creationDate: (new Date()).getTime(),
		random: Math.random() * (Math.random() * 1000),
		nodeVersion: process.version
	};
	var basestring = '';
	_.each(factors, function (val) { basestring += val; });

	// Build hash
	var hash =	crypto.
				createHash('md5').
				update(basestring).
				digest('hex');

	return hash;
};
