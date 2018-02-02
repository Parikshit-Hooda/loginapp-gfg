module.exports = {


  code: 'E_ADAPTER_NOT_COMPATIBLE',


  inputs: {

    adapterIdentity: {
      example: 'sails-mysql',
      required: true
    },

    datastoreIdentity: {
      example: 'localmysql'
    }

  },


  template:
  'The `<%=adapterIdentity%>` adapter appears to be designed for an earlier version of Sails\n'+
  '(it has a `registerCollection()` method, meaning it is for Sails version 0.9.x and below).\n'+
  'Since you\'re running a newer version of Sails, the installed version of this adapter probably isn\'t going to work.\n'+
  'Please visit the documentation for this adapter (e.g. on GitHub) to see if a new version has been released\n'+
  'with support for Sails v0.10 and up, and/or do a search for other community adapters for this database.'+
  '<% if (typeof datastoreIdentity !== \'undefined\') { %>\n(Sails attempted to load this adapter because it is referenced by a datastore (`<%=datastoreIdentity%>`) in this app\'s configuration)<% } %>'


};
