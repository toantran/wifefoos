
###
  GET
  URL /account/profile
###
exports.profile = (req, res) ->
  res.redirect '/player'
exports.profile.methods = ['GET'];
exports.profile.authenticated = true;


###
  GET
  URL  /account/login
###
exports.login = (req, res, next) -> 
  res.render null, {
    username: req.session?.username ? ''
    password: req.session?.password ? ''
    layout: true
    title: 'Wheels Foosball League (WFL) - Log in'
  }
  delete req.session.username
  delete req.session.password  
exports.login.methods = ['GET']


###
  GET, POST
  URL  /account/logout
###
exports.logout = (req, res, next) ->
  # destroy the user's session to log them out
  # will be re-created next request
  req.session.destroy ->
    res.redirect '/'
exports.logout.methods = ['GET', 'POST']


###
  POST 
  URL /account/login
###
exports.authenticate = (req, res) ->  
  req.session.username = username = req.param 'username', ''
  req.session.password = password = req.param 'password', ''
  returnUrl = req.param 'returnurl', '/account/profile'

  if not username
    req.flash 'error', 'Enter Email'
    res.redirect 'back'
  else
    userSvc = require '../services/user'
    userSvc.authenticate username, password, (error, authenticated, user) ->
      if error
        req.flash 'error', error
        res.redirect 'back'
      else if authenticated
        # Regenerate session when signing in
        # to prevent fixation 
        req.session?.regenerate ->
          # Store the user's primary key 
          # in the session store to be retrieved,
          # or in this case the entire user object
          req.session.user = user
          
          # return to the original url or home page   
          res.redirect returnUrl
      else 
        req.flash 'error', 'That Aint Your Password, Homeboy!'
        res.redirect 'back'
exports.authenticate.methods = ['POST']
exports.authenticate.action = 'login'


###
  GET 
  URL  /account/:id/add
###
exports.add = (req, res, next) ->
  res.render req.session.insertuser,  
    title: 'Wheels Foosball League (WFL) - Sign up'
    layout: true  
  delete req.session.insertuser

###
  POST
  URL /account/:id
###
exports.create = (req, res, next) ->
  username = req.param 'username', '' 
  password = req.param 'password', ''
  firstname = req.param 'firstname', ''
  lastname = req.param 'lastname', ''
  nickname = req.param 'nickname', ''
  passwordconfirm = req.param 'passwordconfirm', ''
    
  req.session.insertuser = req.body
  
  if not username
    req.flash 'error', 'We Need Your Email Address, Sucka!'
    res.redirect 'back' 
  else if password isnt passwordconfirm
    req.flash 'error', 'Your Passwords Do Not Match, Jack!'
    res.redirect 'back'
  else
    userSvc = require '../services/user'
    userSvc.insert 
        firstname: firstname
        lastname: lastname
        username: username
        password: password
        nickname: nickname
      , (error, user) ->
        if error
          req.flash 'error', error
          res.redirect 'back'
        else if user
          # Regenerate session when signing in
          # to prevent fixation 
          req.session.regenerate ->
            # Store the user's primary key 
            # in the session store to be retrieved,
            # or in this case the entire user object
            req.session.user = user
            console.log(user);
            # return to the original url or home page                    
            res.redirect "/profile/#{user._id}"
        else
          req.flash 'error', 'Creating user failed...Whats Up With That?'
          res.redirect 'back'
        




