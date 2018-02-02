module.exports = {


  code: 'E_UNRECOGNIZED_DATASTORE',


  inputs: {

    datastoreIdentity: {
      example: 'localmysql',
      required: true
    },

    modelIdentity: {
      example: 'wolf'
    }

  },


  template:
  'Unrecognized datastore `<%= datastoreIdentity %>` <% if (typeof modelIdentity !== \'undefined\') { %>referenced by model (`<%= modelIdentity %>`)<% }%>.\n'+
  'Are you sure that datastore exists?  It should be defined in `sails.config.connections`.',


};
