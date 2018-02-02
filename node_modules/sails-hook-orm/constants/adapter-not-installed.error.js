module.exports = {


  code: 'E_ADAPTER_NOT_INSTALLED',


  inputs: {

    adapterPackageName: {
      example: 'sails-mysql',
      required: true
    },

    datastoreIdentity: {
      example: 'localmysql'
    }

  },


  template:
  'Trying to use an unrecognized adapter, `<%=adapterPackageName%><% if (typeof datastoreIdentity !== \'undefined\') { %>, in datastore `<%=datastoreIdentity%>`.<% } else { %>.<% } %>\n'+
  'This may or may not be a real adapter available on NPM, but in any case it looks like `<%=adapterPackageName%>` is not installed in this app\n'+
  '(at least it is not in the expected path within the local `node_modules/` directory).\n'+
  '\n'+
  'To attempt to install this adapter, run:\n'+
  '`npm install <%=adapterPackageName%> --save'


};
