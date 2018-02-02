module.exports = {


  code: 'E_INVALID_ADAPTER',


  inputs: {

    adapterIdentity: {
      example: 'sails-mysql',
      required: true
    },

    details: {
      description: 'The more detailed error message to display.',
      example: 'If specified, the `defaults` property should be a dictionary.'
    },

    datastoreIdentity: {
      example: 'localMysql',
    }

  },


  template:
  '<% if (typeof datastoreIdentity !== \'undefined\') { %>'+
  'In datastore `<%= datastoreIdentity %>`: '+
  '<% } else { } %>'+
  'Adapter (`<%= adapterIdentity %>`) is invalid.\n'+
  '<% if (typeof details !== \'undefined\') { %> <%= details %> <% } %>'


};
