###
URL /
###
exports.index = (req, res) ->  
  res.render null, 
    title: 'Wheels Foosball League (WFL)'
  	user: req.session.user
  	layout: true
exports.index.methods = ['GET']


###
  GET, POST
  URL /logout
###
exports.logout = (req, res) ->
  res.redirect '/account/logout'
exports.logout.methods = ['POST', 'GET']


###
  GET
  URL /login
###
exports.login = (req, res) ->
  res.redirect '/account/login'
exports.login.methods = ['POST', 'GET']


###
  GET
  URL /rules
###
exports.rules = (req, res) ->
  res.render null,  
    layout: true,
    title: 'Wheels Foosball League - Rules'
