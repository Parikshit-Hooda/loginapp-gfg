module.exports = {


  code: 'E_INVALID_DATASTORE',


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
  '<% if (typeof modelIdentity !== \'undefined\') { %>In model `<%= modelIdentity %>`, c<% } else {%>C<%} %>onfiguration for datastore (`<%= datastoreIdentity %>`) is invalid.\n'+
  'Must contain an `adapter` key referencing the adapter to use.',


};
