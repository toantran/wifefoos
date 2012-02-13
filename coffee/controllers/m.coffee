userSvc = require '../services/user'

exports.authenticate = (req, res, next) ->
  req.session.username = username = req.param 'username', ''
  req.session.password = password = req.param 'password', ''
  returnUrl = req.param 'returnurl', '/m'
  
  if not username
    req.flash 'error', 'Enter Email'
    res.redirect 'back'
  else
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
        req.flash 'error', 'Wrong Password, Homeboy!'
        res.redirect 'back'
      
exports.authenticate.methods = ['POST']


exports.login = (req, res, next) -> 
  res.render null, {
    username: req.session?.username ? ''
    password: req.session?.password ? ''
    layout: 'mobile'
    title: 'Mobile WFL'
  }
  delete req.session.username
  delete req.session.password
  
exports.login.methods = ['GET']


exports.index = (req, res, next) ->
  if req.session?.user
    res.redirect "/m/#{req.session.user._id}"
  else  
    res.redirect '/m/login'   

exports.show = (req, res, next) ->
  userid = req.params?.id
  
  if not userid 
    req.flash 'error', 'Invalid user'
  else
    try
      userSvc.loadMobileUser userid, (error, fullUser) ->
        req.flash 'error', error if error
        res.render fullUser, layout: 'mobile.jade', title: 'Mobile WFL', user: req.session.user
    catch e
      console.log e
      req.flash 'error', e
      next() 
exports.show.authenticated = true



