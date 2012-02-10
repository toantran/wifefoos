
###
# Module dependencies.
###

fs = require 'fs'
express = require 'express'

# App settings and middleware

bootApplication = (app) ->
  app.use express.logger()
  app.use express.bodyParser({uploadDir: '#{__dirname}/public/images/profiles'})
  app.use express.methodOverride()
  app.use express.cookieParser()
  app.use express.session({ secret: 'saigon riverland' })  
  app.use app.router
  app.use express.static('#{__dirname}/public')

  app.use (err, req, res, next) ->
    console.log err
    res.render '500.jade', {layout: false}
  

  # Example 404 page via simple Connect middleware
  app.use (req, res) ->
    res.render '404.jade', {layout: false}
  

  # Setup ejs views as default, with .html as the extension
  app.set 'views', '#{__dirname}/views'
  #app.register('.html', require('ejs'));
  app.set 'view engine', 'jade'

  # Some dynamic view helpers
  app.dynamicHelpers {
    request: (req) -> req,
    
    hasMessages: (req) ->
      if (!req.session) 
        false
      else 
        Object.keys(req.session.flash || {}).length

    , messages: (req) ->
      ->
        msgs = req.flash()
        console.log 'msgs = #{msgs}'     
        result = Object.keys msgs 
                        .reduce (arr, type) ->
                          console.log msgs[type]
                          arr.concat msgs[type]
                              , []
        console.log 'result #{result}'
        result         
  }
  

exports.boot = (app) ->
  bootApplication app
  bootControllers app
