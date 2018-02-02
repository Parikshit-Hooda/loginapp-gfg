var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator=require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var logger = require('morgan');
mongoose.connect('mongodb://localhost/loginapp');
var db = mongoose.connection;

//routes
var routes = require('./routes/index');
var users=require('./routes/users');

//init app
var app=express();
app.use(logger('dev'));

app.set('views', path.join(__dirname,'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

//BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

//express session
app.use(session({
  secret:'secret',
  saveUninitialized: true,
  resave:true
}));

//passport init
app.use(passport.initialize());
app.use(passport.session());


//express validator
app.use(expressValidator({
  errorFormatter:function(param, msg, value){
    var namespace = param.split('.'),
    root = namespace.shift(),
    formParam = root;

    while(namespace.length){
      formParam+='[' + namespace.shift() + ']';
    }
    return{
      param:formParam,
      msg:msg,
      value:value
    };
    }
}));

//connect flash
app.use(flash());

//global vars
app.use(function(req,res,next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use('/', routes);
app.use('/users', users);

//set port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
  console.log('server started on port'+ app.get('port'));
});
