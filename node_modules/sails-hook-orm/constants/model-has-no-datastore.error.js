module.exports = {


  code: 'E_MODEL_HAS_NO_DATASTORE',


  inputs: {

    modelIdentity: {
      example: 'wolf',
      required: true
    }

  },


  template:
  'Cannot determine the appropriate datastore configuration to use for one of your models (`<%= modelIdentity %>`).\n'+
  'Please specify a `connection` for this model, and/or make sure you have a default datastore configured as `sails.config.models.connection`\n'+
  '(this is conventionally set in your `config/models.js` file, or as part of your app\'s environment-specific config).'


};
