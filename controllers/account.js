
/*
  GET
  URL /account/profile
*/

(function() {

  exports.profile = function(req, res) {
    return res.redirect('/player');
  };

  exports.profile.methods = ['GET'];

  exports.profile.authenticated = true;

  /*
    GET
    URL  /account/login
  */

  exports.login = function(req, res, next) {
    var _ref, _ref2, _ref3, _ref4;
    res.render(null, {
      username: (_ref = (_ref2 = req.session) != null ? _ref2.username : void 0) != null ? _ref : '',
      password: (_ref3 = (_ref4 = req.session) != null ? _ref4.password : void 0) != null ? _ref3 : '',
      layout: true,
      title: 'Wheels Foosball League (WFL) - Log in'
    });
    delete req.session.username;
    return delete req.session.password;
  };

  exports.login.methods = ['GET'];

  /*
    GET, POST
    URL  /account/logout
  */

  exports.logout = function(req, res, next) {
    return req.session.destroy(function() {
      return res.redirect('/');
    });
  };

  exports.logout.methods = ['GET', 'POST'];

  /*
    POST 
    URL /account/login
  */

  exports.authenticate = function(req, res) {
    var password, returnUrl, userSvc, username;
    req.session.username = username = req.param('username', '');
    req.session.password = password = req.param('password', '');
    returnUrl = req.param('returnurl', '/account/profile');
    if (!username) {
      req.flash('error', 'Enter Email');
      return res.redirect('back');
    } else {
      userSvc = require('../services/user');
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
          req.flash('error', 'That Aint Your Password, Homeboy!');
          return res.redirect('back');
        }
      });
    }
  };

  exports.authenticate.methods = ['POST'];

  exports.authenticate.action = 'login';

  /*
    GET 
    URL  /account/:id/add
  */

  exports.add = function(req, res, next) {
    res.render(req.session.insertuser, {
      title: 'Wheels Foosball League (WFL) - Sign up',
      layout: true
    });
    return delete req.session.insertuser;
  };

  /*
    POST
    URL /account/:id
  */

  exports.create = function(req, res, next) {
    var firstname, lastname, nickname, password, passwordconfirm, userSvc, username;
    username = req.param('username', '');
    password = req.param('password', '');
    firstname = req.param('firstname', '');
    lastname = req.param('lastname', '');
    nickname = req.param('nickname', '');
    passwordconfirm = req.param('passwordconfirm', '');
    req.session.insertuser = req.body;
    if (!username) {
      req.flash('error', 'We Need Your Email Address, Sucka!');
      return res.redirect('back');
    } else if (password !== passwordconfirm) {
      req.flash('error', 'Your Passwords Do Not Match, Jack!');
      return res.redirect('back');
    } else {
      userSvc = require('../services/user');
      return userSvc.insert({
        firstname: firstname,
        lastname: lastname,
        username: username,
        password: password,
        nickname: nickname
      }, function(error, user) {
        if (error) {
          req.flash('error', error);
          return res.redirect('back');
        } else if (user) {
          return req.session.regenerate(function() {
            req.session.user = user;
            console.log(user);
            return res.redirect("/profile/" + user._id);
          });
        } else {
          req.flash('error', 'Creating user failed...Whats Up With That?');
          return res.redirect('back');
        }
      });
    }
  };

}).call(this);
