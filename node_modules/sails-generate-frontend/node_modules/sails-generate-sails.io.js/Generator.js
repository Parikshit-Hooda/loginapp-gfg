/**
 * sails-generate-sails.io.js
 *
 * Usage:
 * `sails generate sails.io.js`
 *
 * @description Generates a sails-generate-sails.io.js
 * @help See http://links.sailsjs.org/docs/generators
 */

module.exports = {

  /**
   * The files/folders to generate.
   * @type {Object}
   */

  targets: {
    './assets/js/dependencies/sails.io.js': { template: 'sails.io.js' }
  },


  /**
   * The absolute path to the `templates` for this generator
   * (for use with the `template` helper)
   *
   * @type {String}
   */
  templatesDirectory: require('path').dirname(require.resolve('sails.io.js-dist'))
};
