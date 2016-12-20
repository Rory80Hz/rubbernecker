var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var utils = require('./lib/utils.js')
var routes = require('./routes/index');

var app = express();

var useAuth = process.env.USE_AUTH || 'false'
if (useAuth === 'true') {
  var username = process.env.USERNAME
  var password = process.env.PASSWORD
  app.use(utils.basicAuth(username, password))
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

/**
 * Set API Key based on Environment variable
 **/
var pivotalApiKey = process.env.PIVOTAL_API_KEY || 'You need to set a key';
app.set('pivotalApiKey', pivotalApiKey);

var pivotalProjectId = process.env.PIVOTAL_PROJECT_ID || 'You need to set a project Id';
app.set('pivotalProjectId', pivotalProjectId);

var reviewSlotsLimit = process.env.REVIEW_SLOTS_LIMIT || 4;
app.set('reviewSlotsLimit', reviewSlotsLimit);

var signOffSlotsLimit = process.env.REVIEW_SLOTS_LIMIT || 5;
app.set('signOffSlotsLimit', signOffSlotsLimit);

module.exports = app;