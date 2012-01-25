var crypto = require('crypto');

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { 
  	title: 'ScrumTrak',
  	user: req.session.user,
  	layout: true
  })
};

/*
  GET
  URL  /login
*/
exports.login = function(req, res) {
  res.render('login', {
    title: 'ScrumTrak - Log in',
    layout: true
  });
};

/*
  POST 
  URL /login
*/
exports.authenticate = function(req, res, next) {
  var username = req.body.username,
      password = req.body.password;
  
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
        next();      
      } );
    } else {
      res.send('FAILED Password unmatched');
    }
  });  
}

/*
  GET 
  URL  /signup
*/
exports.signup = function(req, res, next) {
  res.render('signup', {
    title: 'ScrumTrak - Sign up',
    layout: true
  });
}

/*
  POST 
  URL  /signup
*/
exports.insertUser = function(req, res, next) {
  var username = req.body.username,
      password = req.body.password;
  
  insertUser(username, password, function(error, user) {
    if (error) {
      res.send('FAILED ' + error);
    } else if (user){
      next();
    } else {
      res.send('FAILED user empty');
    }
  });
}


/*
  load user landing page
  
*/
exports.projects = function(req, res) {
  res.render('projects', {
    title: 'ScrumTrak - Projects',
    user: req.session.user,
    layout: true
  });
}


/*
  insert a user record into the DB
*/
function insertUser(username, password, callback) {
  var repo = require('../repository'),
      encryptedPassword = hash(password, 'a little dog'),
      user = {username: username, password: encryptedPassword},
      result = repo.insertUser(user, function(error, savedUser) {
        if (error) {
          console.log(error);
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
