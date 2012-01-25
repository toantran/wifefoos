
/**
 * Module dependencies.
 */

var fs = require('fs')
  , express = require('express');

exports.boot = function(app){
  bootApplication(app);
  bootControllers(app);
};

// App settings and middleware

function bootApplication(app) {
  app.use(express.logger(':method :url :status'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'saigon riverland' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  // Example 500 page
  app.use(function(err, req, res, next){
    res.render('500.jade', {layout: false});
  });

  // Example 404 page via simple Connect middleware
  app.use(function(req, res){
    res.render('404.jade', {layout: false});
  });

  // Setup ejs views as default, with .html as the extension
  app.set('views', __dirname + '/views');
  //app.register('.html', require('ejs'));
  app.set('view engine', 'jade');

  // Some dynamic view helpers
  app.dynamicHelpers({
    request: function(req){
      return req;
    },

    hasMessages: function(req){
      if (!req.session) return false;
      return Object.keys(req.session.flash || {}).length;
    },

    messages: function(req){
      return function(){
        var msgs = req.flash();
        return Object.keys(msgs).reduce(function(arr, type){
          return arr.concat(msgs[type]);
        }, []);
      }
    }
  });
}

// Bootstrap controllers

function bootControllers(app) {
  fs.readdir(__dirname + '/controllers/', function(err, files){
    if (err) throw err;
    files.forEach(function(file){
      bootController(app, file);
    });
  });
}

// Example (simplistic) controller support

function bootController(app, file) {
  var name = file.replace('.js', '')
    , actions = require('./controllers/' + name)
    , plural = name + 's' // realistically we would use an inflection lib
    , prefix = '/' + name; 

  // Special case for "app"
  if (name == 'app') prefix = '/';

  Object.keys(actions).map(function(action){
    var routeFn = actions[action]
      , methods = routeFn.methods || ['GET']
      , realaction = routeFn.action || action
      , path = (prefix === '/' ? '' : prefix) + '/' + realaction
      , restricted = routeFn.authenticated || false
      , fn = restricted ? [restrict] : [];
      
    fn.push( controllerAction(name, plural, action, routeFn) );
    
    console.log('fn.length = ', fn.length);
    switch(action) {
      case 'index':
        app.get(prefix, fn);
        break;
      case 'show':
        app.get(prefix + '/:id.:format?', fn);
        break;
      case 'add':
        app.get(prefix + '/:id/add', fn);
        break;
      case 'create':
        app.post(prefix + '/:id', fn);
        break;
      case 'edit':
        app.get(prefix + '/:id/edit', fn);
        break;
      case 'update':
        app.put(prefix + '/:id', fn);
        break;
      case 'destroy':
        app.del(prefix + '/:id', fn);
        break;
      default:        
        methods.forEach( function(method) {
          console.log('Path ', path, ' action ', realaction, ' method ', method);
          switch (method) {
            case 'POST':
              app.post(path, fn);
              break;
            case 'PUT':
              app.post(path, fn);
              break;
            case 'DEL':
              app.del(path, fn);
              break;
            default: 
              app.get(path, fn);
              break;
          }
        });
        //app.get(prefix + '/' + action, fn);
        break;
    }
  });
}

// Proxy res.render() to add some magic

function controllerAction(name, plural, action, fn) {
  return function(req, res, next){
    var render = res.render
      , format = req.params.format
      , path = __dirname + '/views/' + name + '/' + action + '.jade';      
    res.render = function(obj, options, fn){
      console.log('render invoked ', obj, options);
      res.render = render;
      // Template path
      if (typeof obj === 'string') {
        return res.render(obj, options, fn);
      }

      // Format support
      if (action == 'show' && format) {
        if (format === 'json') {
          return res.send(obj);
        } else {
          throw new Error('unsupported format "' + format + '"');
        }
      }

      // Render template
      res.render = render;
      options = options || {};
      // Expose obj as the "users" or "user" local
      if (action == 'index') {
        options[plural] = obj;
      } else {
        options[name] = obj;
      }
      console.log('render path', path);
      return res.render(path, options, fn);
    };
    fn.apply(this, arguments);
  };
}


// Check authenticated 
function restrict(req, res, next) {
  console.log('hi');
  if (req.session.user) {
    next();
  } else {
    req.session.error = 'Access denied!';
    res.redirect('/login');
  }
}
