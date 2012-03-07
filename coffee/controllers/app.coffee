###
URL /
###
exports.index = (req, res) ->  
  newsSvc = require '../services/news'
  utils = require '../services/utils'
  
  utils.execute( newsSvc.getNews )
  .then ( err, @news, cb = -> ) =>
    newsSvc.getHighlights cb
  .then (err, @highlights, cb = ->) =>
    res.render null, 
      title: 'Wheels Foosball League (WFL)'
    	user: req.session.user
    	layout: true
    	news: @news
    	highlights: @highlights
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
