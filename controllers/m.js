(function() {
  var userSvc;

  userSvc = require('../services/user');

  exports.authenticate = function(req, res, next) {
    var password, returnUrl, username;
    req.session.username = username = req.param('username', '');
    req.session.password = password = req.param('password', '');
    returnUrl = req.param('returnurl', '/m');
    if (!username) {
      req.flash('error', 'Enter Email');
      return res.redirect('back');
    } else {
      return userSvc.authenticate(username, password, function(error, authenticated, user) {
        var _ref;
        if (error) {
          req.flash('error', error);
          return res.redirect('back');
        } else if (authenticated) {
          return (_ref = req.session) != null ? _ref.regenerate(function() {
            req.session.user = user;
            return res.redirect(returnUrl);
          }) : void 0;
        } else {
          req.flash('error', 'Wrong Password, Homeboy!');
          return res.redirect('back');
        }
      });
    }
  };

  exports.authenticate.methods = ['POST'];

  exports.login = function(req, res, next) {
    var _ref, _ref2, _ref3, _ref4;
    res.render(null, {
      username: (_ref = (_ref2 = req.session) != null ? _ref2.username : void 0) != null ? _ref : '',
      password: (_ref3 = (_ref4 = req.session) != null ? _ref4.password : void 0) != null ? _ref3 : '',
      layout: 'mobile',
      title: 'Mobile WFL'
    });
    delete req.session.username;
    return delete req.session.password;
  };

  exports.login.methods = ['GET'];

  exports.index = function(req, res, next) {
    var _ref;
    if ((_ref = req.session) != null ? _ref.user : void 0) {
      return res.redirect("/m/" + req.session.user._id);
    } else {
      return res.redirect('/m/login');
    }
  };

  exports.show = function(req, res, next) {
    var userid, _ref;
    userid = (_ref = req.params) != null ? _ref.id : void 0;
    if (!userid) {
      return req.flash('error', 'Invalid user');
    } else {
      try {
        return userSvc.loadMobileUser(userid, function(error, fullUser) {
          if (fullUser == null) fullUser = {};
          if (error) req.flash('error', error);
          return res.render(fullUser, {
            layout: 'mobile.jade',
            title: 'Mobile WFL',
            user: req.session.user
          });
        });
      } catch (e) {
        console.log(e);
        req.flash('error', e);
        return next();
      }
    }
  };

  exports.show.authenticated = true;

}).call(this);
