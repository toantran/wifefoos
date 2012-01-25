var crypto = require('crypto');

/*
  GET
  URL  /account/login
*/
exports.login = function(req, res) {
  console.log('login');
  res.render(null, {
    title: 'W.I.F.E - Log in',
    layout: true
  });
}
exports.login.methods = ['GET'];
exports.login.action = 'login';


/*
  GET, POST
  URL  /account/logout
*/
exports.logout = function(req, res) {
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/');
  });
}
exports.logout.methods = ['GET', 'POST'];


/*
  POST 
  URL /account/login
*/
exports.authenticate = function(req, res) {  
  var username = req.param('username', '')
      , password = req.param('password', '')
      , returnUrl = req.param('returnurl', 'profile');
  
  authenticate(username, password, function(error, authenticated, user) {
    if (error) {
      res.send('FAILED ' + error);
    } else if (authenticated){
      // Regenerate session when signing in
      // to prevent fixation 
      req.session.regenerate( function() {
        // Store the user's primary key 
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        
        // return to the original url or home page        
        res.redirect(returnUrl);
      } );
    } else {
      res.send('FAILED Password unmatched');
    }
  });  
}
exports.authenticate.methods = ['POST'];
exports.authenticate.action = 'login';


/*
  GET 
  URL  /account/signup
*/
exports.signup = function(req, res) {
  res.render(req.session.insertuser, {
    title: 'W.I.F.E - Sign up',
    layout: true
  });
  delete req.session.insertuser;
}
exports.signup.methods = ['GET'];

/*
  POST
  URL /account/signup
*/
exports.insertuser = function(req, res, next) {
  var username = req.param('username', '')
    , password = req.param('password', '')
    , firstname = req.param('firstname', '')
    , lastname = req.param('lastname', '')
    , passwordconfirm = req.param('passwordconfirm', '');
    
  req.session.insertuser = req.body; 
  
  if (!username) {
    req.flash('error', 'Email address cannot be empty');
    res.redirect('back');
    return;
  }
  
  if (password !== passwordconfirm) {
    req.flash('error', 'Passwords not match!');
    res.redirect('back');
    return;
  }
  
  insertUser({
    firstname: firstname
    , lastname: lastname
    , username: username
    , password: password
  }, function(error, user) {
    if (error) {
      req.flash('error', error);
      res.redirect('back');
    } else if (user){
      // Regenerate session when signing in
      // to prevent fixation 
      req.session.regenerate( function() {
        // Store the user's primary key 
        // in the session store to be retrieved,
        // or in this case the entire user object
        req.session.user = user;
        
        // return to the original url or home page        
        res.redirect('profile');
      } );
    } else {
      req.flash('error', 'Creating user failed');
      res.redirect('back');
    }
  });
}
exports.insertuser.methods = ['POST'];
exports.insertuser.action = 'signup';

/*
  GET
  URL /account/profile
*/
exports.profile = function(req, res) {
  res.render('', {
    title: 'W.I.F.E - Profile',
    user: req.session.user,
    layout: true
  });
}
exports.profile.methods = ['GET'];
exports.profile.authenticated = true;


/*
  insert a user record into the DB
*/
function insertUser(user, callback) {
  var repo = require('../repository'),
      encryptedPassword = hash(user.password, 'a little dog');

  user.password = encryptedPassword;
  repo.insertUser(user, function(error, savedUser) {
    if (error) {
      callback(error);
    } else {
      callback(null, savedUser);
    }
  });

  return true;
}


/*
  Authenticate user login  
*/
function authenticate(username, password, callback) {
  var repo = require('../repository'),
      encryptedPassword = hash(password, 'a little dog'),
      user = repo.getUser(username, function(error, user) {
        if (error) {
          console.log(error);
          callback.call(this, error);
        } else if (user){
          if (encryptedPassword === user.password) {
            callback.call(this, null, true, user);
          } else {
            callback.call(this, null, false);
          }
        } else {
          callback.call(this, 'User not found', false);
        }
      });
  
  return user;    
}


function hash(msg, key) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

