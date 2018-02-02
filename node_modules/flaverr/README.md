# flaverr

Flavor an Error instance with the specified error code string or dictionary of customizations.


## Installation &nbsp; [![NPM version](https://badge.fury.io/js/flaverr.svg)](http://badge.fury.io/js/flaverr)

```bash
$ npm install flaverr --save --save-exact
```


## Usage

- If you provide a string as the first argument, that string will be set as the Error's `code`.
- If you provide a dictionary as the first argument, that dictionary's keys will get folded into the Error as properties.


#### Attach an error code

```javascript
var flaverr = require('flaverr');

var err = flaverr('notFound', new Error('Could not find user with the specified id.'));
// => assert(err.code === 'notFound' && err.message === 'Could not find user with the specified id.')
// => assert(err.constructor.name === 'Error')
```

#### Attach arbitrary properties

```javascript
var flaverr = require('flaverr');

var err = flaverr({
  code: 'notFound',
  output: { foo: 'bar' }
}, new Error('Could not find user with the specified id.'));
// => assert(err.code === 'notFound' && err.message === 'Could not find user with the specified id.')
// => assert(err.constructor.name === 'Error')
```


## A few examples of common use cases

#### Tagging an error with a code before sending it through an asynchronous callback

```javascript
if (err) { return done(err); }
if (!user) {
  return done(flaverr('notFound', new Error('Could not find a user with that id (`'+req.param('id')+'`).')));
}
```


#### In a `try` statement

```javascript
try {
  _.each(paths, function (thisPath) {
    var isDirectory = fs.statFileSync(path.resolve(thisPath)).isDirectory();
    if (!isDirectory) {
      throw flaverr('notADirectory', new Error('One of the provided paths (`'+path.resolve(thisPath)+'`) points to something other than a directory.'));
    }
  });
} catch (e) {
  switch (e.code) {
    case 'ENOENT': return exits.notFound();
    case 'notADirectory': return exits.invalidPath(e);
    default: return exits.error(e);
  }
}
```

#### In an asynchronous loop

```javascript
async.eachSeries(userRecords, function (user, next) {
  
  if (user.pets.length === 0) {
    return next(flaverr('noPets', new Error('User (`'+user.id+'`) has no pets yet!')));
  }

  if (!user.hobby) {
    return next(flaverr('noHobby', new Error('Consistency violation: User (`'+user.id+'`) has no hobby!')));
  }

  async.each(user.pets, function (pet, next){
    Pet.update().where({ id: pet.id })
    .set({ likelyHobby: user.hobby })
    .exec(next);
  }, function (err){
    if (err) { return next(err); }
    if (err.code === 'E_UNIQUE') { return next(flaverr('nonUniquePetHobby', err)); }
    return next();
  });

}, function afterwards(err) {
  if (err) {
    switch (err.code) {
      case 'noPets': return res.send(409, err.message);
      case 'noHobby': return res.serverError(err);
      case 'nonUniquePetHobby': return res.send(409, 'A pet already exists with that hobby.');
      default: return res.serverError(err);
    }
  }//--•

  return res.ok();
});
```



## License

MIT &copy; 2016 Mike McNeil

