
/*
# Module dependencies.
*/

(function() {
  var bootApplication, express, fs;

  fs = require('fs');

  express = require('express');

  bootApplication = function(app) {
    app.use(express.logger());
    app.use(express.bodyParser({
      uploadDir: '#{__dirname}/public/images/profiles'
    }));
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: 'saigon riverland'
    }));
    app.use(app.router);
    app.use(express.static('#{__dirname}/public'));
    app.use(function(err, req, res, next) {
      console.log(err);
      return res.render('500.jade', {
        layout: false
      });
    });
    app.use(function(req, res) {
      return res.render('404.jade', {
        layout: false
      });
    });
    app.set('views', '#{__dirname}/views');
    app.set('view engine', 'jade');
    return app.dynamicHelpers({
      request: function(req) {
        return req;
      },
      hasMessages: function(req) {
        if (!req.session) {
          return false;
        } else {
          return Object.keys(req.session.flash || {}).length;
        }
      },
      messages: function(req) {
        return function() {
          var msgs, result;
          msgs = req.flash();
          console.log('msgs = #{msgs}');
          result = Object.keys(msgs.reduce(function(arr, type) {
            console.log(msgs[type]);
            return arr.concat(msgs[type], []);
          }));
          console.log('result #{result}');
          return result;
        };
      }
    });
  };

  exports.boot = function(app) {
    bootApplication(app);
    return bootControllers(app);
  };

}).call(this);
