var express= require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

router.get('/register', function(req,res){
  res.render('register');
});

router.get('/login', function(req,res){
  res.render('login');
});

router.post('/register', function(req,res){
  var name = req.body.name;
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var password2 = req.body.password2;

  req.checkBody('name', 'name is required').notEmpty();
  req.checkBody('username', 'username is required').notEmpty();
  req.checkBody('email', 'email is required').notEmpty();
  req.checkBody('email', 'please enter in correct email format').isEmail();
  req.checkBody('password', 'password is required').notEmpty();
  req.checkBody('password2', 'passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();
  if(errors){
    res.render('register',{
      errors:errors
    });
  } else {
    var newUser = new User({
      name:name,
      email:email,
      username:username,
      password:password
    });
    user.createUser(newUser, function(err, user){
      if(err) throw err;
      console.log(err);
    });
    req.flash('success_msg','you are now registered and can login');
    res.redirect('/users/login');
  }
});

passport.use(new LocalStrategy(
  function(username, password, done){
    User.getUserByUsername(username, function(err,user){
      if(err) throw err;
      if(!user){
        return done(null, false, {message:'unknown user'});
    }
    User.comparePassword(password, user.password, function(err, isMatch){
      if(err) throw err;
      if(isMatch){
        return done(null, user);
      } else {
        return done(null, false, 'wrong password');
      }
    });
  });
}));

passport.serializeUser(function(user, done){
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user){
    done(err, user);
  });
});

router.post('/login', passport.authenticate('local', (successRedirect:'/', failureRedirect:"/users/login", failureFlash:true)), function(req,res){
  res.redirect('/');
});

router.post('/logout', function(req,res){
  req.logout();
  req.flash('success', 'logout successfull');
  res.redirect('/users/login');
});

module.exports = router;
