module.exports = {


  code: 'E_MODEL_HAS_MULTIPLE_DATASTORES',


  inputs: {

    modelIdentity: {
      example: 'wolf',
      required: true
    }

  },


  template:
  'One of your models (`<%= modelIdentity %>`) refers to multiple datastores.\n'+
  'Please set its configured datastore to a string instead of an array in its model definition (`.connection`) or the app-wide default (`sails.config.models.connection`)\n'+
  '(this is conventionally set in your `config/models.js` file, or as part of your app\'s environment-specific config).'


};
