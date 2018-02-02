# @sailshq/lodash

A fork of Lodash 3.10.x with ongoing maintenance from the Sails core team.

This repo will only be updated when there are immediate, material issues affecting expected usage, like [this one](https://github.com/lodash/lodash/issues/2768).  Our goal is to diverge as little as possible, and to encourage the use of Lodash 4 and above whenever possible.  This repo is really just for us, and anyone else who really likes Lodash 3 exactly the way it is.

**In other words, there will _never_ be any new methods or options added to Lodash on this fork, and consequently there will be no minor version or major version bumps from this fork-- only patches.**


> ### Sails <=v0.12 users:
>
> **This is the version of Lodash exposed as a default global (`_`) in Sails apps prior to Sails v1.0.**
>
> ...but Sails v1.0 changes that.
>
> If your app is using Sails v1.0 or above, or if you are on <=0.12, but are not using the Lodash global,
> then you needn't worry about this package-- it is used interally in Sails, but does not touch userland
> code in your application.  [Click here](http://sailsjs.com/documentation/reference/configuration/sails-config-globals)
> to learn about how the Lodash global works in Sails v1.0.
>
> On the other hand, if your app _is_ using Sails <=0.12 and you _are_ using the Lodash global:
> + [Click here](https://lodash.com/docs/3.10.1) for usage docs
> + [Click here](http://0.12.sailsjs.com/documentation/reference/configuration/sails-config-globals) to see how to disable that global and use your own version of Lodash.



## Bugs &nbsp; [![NPM version](https://badge.fury.io/js/@sailshq/lodash.svg)](http://npmjs.com/package/@sailshq/lodash)

To report a bug, [click here](http://sailsjs.com/bugs).


## Contributing

Please observe the guidelines and conventions laid out in the [Sails project contribution guide](http://sailsjs.com/contribute) when opening issues or submitting pull requests.

[![NPM](https://nodei.co/npm/@sailshq/lodash.png?downloads=true)](http://npmjs.com/package/@sailshq/lodash)

## License

### Lodash license

[Lodash](http://lodash.com) is free and open source under the [MIT License](https://github.com/lodash/lodash/blob/3.10.1/LICENSE).

All ad hoc additions in this repo are also MIT-licensed.

### Sails framework license

The [Sails framework](http://sailsjs.com) is free and open-source under the [MIT License](http://sailsjs.com/license).
