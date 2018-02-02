# [<img title="skipper-disk - Local disk adapter for Skipper" src="http://i.imgur.com/P6gptnI.png" width="200px" alt="skipper emblem - face of a ship's captain"/>](https://github.com/balderdashy/skipper-disk) Disk Blob Adapter

[![NPM version](https://badge.fury.io/js/skipper-disk.png)](http://badge.fury.io/js/skipper-disk) &nbsp; &nbsp;
[![Build Status](https://travis-ci.org/balderdashy/skipper-disk.svg?branch=master)](https://travis-ci.org/balderdashy/skipper-disk)

Local filesystem adapter for receiving [upstreams](https://github.com/balderdashy/skipper#what-are-upstreams). Particularly useful for streaming multipart file uploads from the [Skipper](github.com/balderdashy/skipper) body parser.


## Installation

```
$ npm install skipper-disk --save
```

If you're using this module with Express, Connect, Kraken, or a vanilla Node.js server, make sure you have skipper itself [installed as your body parser](http://beta.sailsjs.org/#/documentation/concepts/Middleware?q=adding-or-overriding-http-middleware).  This is the default configuration in [Sails](https://github.com/balderdashy/sails) as of v0.10.



## Usage

> This module is bundled as the default file upload adapter in Skipper, so the following usage is slightly simpler than it is with the other Skipper file upload adapters.

In the route(s) / controller action(s) where you want to accept file uploads, do something like:

```javascript
req.file('avatar')
.upload({
  // ...options here...
},function whenDone(err, uploadedFiles) {
  if (err) return res.negotiate(err);
  else return res.ok({
    files: uploadedFiles,
    textParams: req.params.all()
  });
});
```

For more detailed usage information and a full list of available options, see the Skipper repo, especially the section on "[https://github.com/balderdashy/skipper#uploading-files-to-disk](Uploading to Local Disk)".


## Contribute

See [ROADMAP.md](https://github.com/balderdashy/skipper-s3/blob/master/ROADMAP.md).

Also be sure to check out [ROADMAP.md in the Skipper repo](https://github.com/balderdashy/skipper/blob/master/ROADMAP.md).

To run the tests:

```shell
$ npm test
```




## License

**[MIT](./LICENSE)**
&copy; 2013, 2014-

[Mike McNeil](http://michaelmcneil.com), [Balderdash](http://balderdash.co) & contributors

See `LICENSE.md`.

This module is part of the [Sails framework](http://sailsjs.org), and is free and open-source under the [MIT License](http://sails.mit-license.org/).


![image_squidhome@2x.png](http://i.imgur.com/RIvu9.png)


[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/a22d3919de208c90c898986619efaa85 "githalytics.com")](http://githalytics.com/balderdashy/sails.io.js)
