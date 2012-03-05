
/*
  GET 
  URL /account/reset
*/

(function() {

  exports.reset = function(req, res, next) {
    var token, userSvc;
    token = req.param('id', '');
    if (!(token != null)) {
      return next();
    } else {
      userSvc = require('../services/user');
      return userSvc.getUserByToken(token, function(err, user) {
        if (err != null) req.flash('error', err);
        if (user != null) req.session.tokenverified = true;
        return res.render(user, {
          tokenfound: user != null,
          title: 'WFL - Reset Password',
          layout: true
        });
      });
    }
  };

  exports.reset.methods = ['GET'];

  exports.reset.action = 'reset/:id';

  /*
    POST 
    URL /account/reset
  */

  exports.resetpassword = function(req, res, next) {
    var confirmpassword, password, userSvc, userid;
    password = req.param('password', '');
    confirmpassword = req.param('confirmpassword', '');
    userid = req.param('userid', '');
    if (req.session.tokenverified !== true) return next();
    if (!password || !confirmpassword || !userid) {
      req.flash('error', 'Your Passwords Do Not Match');
      return res.redirect('back');
    } else if (password !== confirmpassword) {
      req.flash('error', 'Your Passwords Do Not Match');
      return res.redirect('back');
    } else {
      userSvc = require('../services/user');
      return userSvc.setPassword(userid, password, function(err, user) {
        if (err != null) req.flash('error', err);
        return res.redirect('/account/login');
      });
    }
  };

  exports.resetpassword.methods = ['POST'];

  exports.resetpassword.action = 'reset*';

  /*
    GET
    URL  /account/recover
  */

  exports.recover = function(req, res) {
    return res.render(null, {
      layout: true,
      title: 'WFL - Reset password'
    });
  };

  exports.recover.methods = ['GET'];

  /*
    POST
    URL  /account/recover
  */

  exports.resettoken = function(req, res) {
    var email, userSvc;
    email = req.body.email;
    console.log('reset token', email);
    if ((email != null) && email) {
      userSvc = require('../services/user');
      return userSvc.createResetPasswordToken(email, function(err, token, user) {
        var emailSvc;
        if (err != null) {
          req.flash('error', err);
          return res.send({
            success: false,
            error: err
          });
        } else {
          emailSvc = require('../services/email');
          return emailSvc.sendmail({
            to: email,
            subject: 'Reset WFL password',
            html: "A request have been made to reset your WFL password.<BR>Click on <a href='http://" + (req.header('host')) + "/account/reset/" + token + "'>this link</a> to reset your password.  If you did not or requested by mistake, please ignore this email.<BR>Thanks,<BR>WFL Game Keeper"
          }, function(mailerr) {
            if (mailerr != null) {
              req.flash('error', mailerr);
              return res.send({
                success: false,
                error: mailerr
              });
            } else {
              return res.send({
                success: true
              });
            }
          });
        }
      });
    }
  };

  exports.resettoken.methods = ['POST'];

  exports.resettoken.action = 'recover';

  /*
    GET
    URL /account/profile
  */

  exports.profile = function(req, res) {
    return res.redirect('/profile');
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
