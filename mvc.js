
/*
 Module dependencies.
*/

(function() {
  var bootApplication, bootController, bootControllers, controllerAction, express, fs, isMobileAgent, mobileController, restrict;

  fs = require('fs');

  express = require('express');

  isMobileAgent = function(ua) {
    var re;
    re = /android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i;
    return re.test(ua.substr(0, 4));
  };

  mobileController = function(req, res, next) {
    var ua;
    ua = req.headers['user-agent'].toLowerCase();
    return next();
  };

  bootApplication = function(app) {
    app.use(express.logger());
    app.use(express.bodyParser({
      uploadDir: "" + __dirname + "/public/images/profiles"
    }));
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: 'saigon riverland'
    }));
    app.use(app.router);
    app.use(express['static']("" + __dirname + "/public"));
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
    app.set('views', "" + __dirname + "/views");
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
          var msgs, reduceFn, result;
          msgs = req.flash();
          reduceFn = function(arr, type) {
            return arr.concat(msgs[type]);
          };
          return result = Object.keys(msgs).reduce(reduceFn, []);
        };
      }
    });
  };

  restrict = function(req, res, next) {
    var returnurl, _ref;
    if ((_ref = req.session) != null ? _ref.user : void 0) {
      req.user = req.session.user;
      return next();
    } else {
      returnurl = encodeURIComponent(req.url);
      req.session.error = 'Access denied!';
      return res.redirect("/account/login?returnurl=" + returnurl);
    }
  };

  controllerAction = function(name, plural, action, fn) {
    return function(req, res, next) {
      var format, path, render;
      render = res.render;
      format = req.params.format;
      path = "" + __dirname + "/views/" + name + "/" + action + ".jade";
      res.render = function(obj, options, fn) {
        res.render = render;
        if (typeof obj === 'string') {
          if (options != null) {
            if (options.user == null) options.user = req.session.user;
          }
          return res.render(obj, options, fn);
        }
        if (action === 'show' && format) {
          if (format === 'json') {
            return res.send(obj);
          } else {
            throw new Error("unsupported format '" + format + "'");
          }
        }
        res.render = render;
        if (options == null) options = {};
        if (action === 'index') {
          options[plural] = obj;
        } else {
          options[name] = obj;
        }
        if (options != null) {
          if (options.user == null) options.user = req.session.user;
        }
        return res.render(path, options, fn);
      };
      return fn.apply(this, arguments);
    };
  };

  bootController = function(app, file) {
    var actions, name, plural, prefix;
    name = file.replace('.js', '');
    actions = require("./controllers/" + name);
    plural = "" + name + "s";
    prefix = "/" + name;
    if (name === 'app') prefix = '/';
    return Object.keys(actions).map(function(action) {
      var fn, method, methods, path, realaction, restricted, routeFn, _i, _len, _ref, _ref2, _ref3, _results;
      routeFn = actions[action];
      methods = (_ref = routeFn.methods) != null ? _ref : ['GET'];
      realaction = (_ref2 = routeFn.action) != null ? _ref2 : action;
      path = prefix === '/' ? "/" + realaction : "" + prefix + "/" + realaction;
      restricted = (_ref3 = routeFn.authenticated) != null ? _ref3 : false;
      fn = name === 'm' ? [] : [mobileController];
      if (restricted) fn.push(restrict);
      fn.push(controllerAction(name, plural, action, routeFn));
      switch (action) {
        case 'index':
          app.get(prefix, fn);
          return console.log("Routing GET " + prefix);
        case 'show':
          app.get("" + prefix + "/:id.:format?", fn);
          return console.log("Routing GET ", "" + prefix + "/:id.:format?");
        case 'add':
          app.get("" + prefix + "/add", fn);
          return console.log("Routing GET ", "" + prefix + "/add");
        case 'create':
          app.post("" + prefix + "/:id", fn);
          return console.log("Routing POST ", "" + prefix);
        case 'edit':
          app.get("" + prefix + "/:id/edit", fn);
          return console.log("Routing GET ", "" + prefix + "/:id/edit");
        case 'update':
          app.put("" + prefix + "/:id", fn);
          return console.log("Routing PUT ", "" + prefix + "/:id");
        case 'destroy':
          app.del("" + prefix + "/:id", fn);
          return console.log("Routing DEL ", "" + prefix + "/:id");
        default:
          _results = [];
          for (_i = 0, _len = methods.length; _i < _len; _i++) {
            method = methods[_i];
            _results.push((function(method) {
              switch (method) {
                case 'POST':
                  app.post(path, fn);
                  return console.log("Routing POST ", path);
                case 'PUT':
                  app.put(path, fn);
                  return console.log('Routing PUT ', path);
                case 'DEL':
                  app.del(path, fn);
                  return console.log('Routing DEL ', path);
                default:
                  app.get(path, fn);
                  return console.log('Routing GET ', path);
              }
            })(method));
          }
          return _results;
      }
    });
  };

  bootControllers = function(app) {
    return fs.readdir("" + __dirname + "/controllers/", function(err, files) {
      var file, _i, _len, _results;
      if (err) throw err;
      _results = [];
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        _results.push(bootController(app, file));
      }
      return _results;
    });
  };

  exports.boot = function(app) {
    bootApplication(app);
    return bootControllers(app);
  };

}).call(this);
