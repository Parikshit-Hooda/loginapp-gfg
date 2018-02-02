# merge-defaults

Implements a deep version of `_.defaults`.


## Installation

```sh
$ npm install merge-defaults
```

## Usage

```javascript

var _ = require('lodash');

// Override basic `_.defaults`
_.defaults = require('merge-defaults');

// Or you can add it as a new method
_.mergeDefaults = require('merge-defaults');

```

## Why?

This module is a temporary solution, until lodash has something
similar in core that can be called as an atomic, single method.
In the mean time, this is a hack to make our code more readable.
i.e. I know what `_.defaults` means intuitively, but I have to look up `_.partialRight`.

## License

MIT &copy; Mike McNeil 2014
