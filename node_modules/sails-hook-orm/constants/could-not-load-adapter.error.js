module.exports = {


  code: 'E_COULD_NOT_LOAD_ADAPTER',


  inputs: {

    adapterPackageName: {
      example: 'sails-mysql',
      required: true
    },

    originalErrorStackTrace: {
      description: 'The `stack` property of the Error that was thrown when attempting to require the adapter.',
      example: 'Error\n at repl:1:7\n at REPLServer.self.eval (repl.js:112:21)\n at repl.js:249:20\n at REPLServer.self.eval (repl.js:122:7)',
      required: true
    },

    datastoreIdentity: {
      example: 'localMySQL'
    }

  },


  template:
  'There was an error attempting to load `<%=adapterPackageName%>`.\n'+
  '<% if (typeof datastoreIdentity !== \'undefined\') { %>(Sails attempted to load this adapter because it is referenced by a datastore (`<%=datastoreIdentity%>`) in this app\'s configuration)\n<% } %>'+
  'Please ensure that `<%=adapterPackageName%>` is a valid Sails/Waterline adapter, and that it is installed in this app.\n'+
  '\n'+
  'Error details:\n'+
  '<% originalErrorStackTrace %>'


};
