
###
 Module dependencies.
###

fs = require 'fs'
express = require 'express'

isMobileAgent = (ua) ->
  re = /android.+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|e\-|e\/|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(di|rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|xda(\-|2|g)|yas\-|your|zeto|zte\-/i
  re.test ua.substr(0,4)

mobileController = (req, res, next) ->
  ua = req.headers['user-agent'].toLowerCase()
  next()
  #if isMobileAgent( ua )
  #  res.rediect '/m'
  #else
  #  next()
	
# App settings and middleware
bootApplication = (app) ->
  app.use express.logger()
  app.use express.bodyParser({uploadDir: "#{__dirname}/public/images/profiles"})
  app.use express.methodOverride()
  app.use express.cookieParser()
  app.use express.session({ secret: 'saigon riverland' })  
  app.use app.router
  app.use express['static']("#{__dirname}/public")
  app.use (err, req, res, next) ->
    console.log err
    res.render '500.jade', {layout: false}
  

  # Example 404 page via simple Connect middleware
  app.use (req, res) ->
    res.render '404.jade', {layout: false}
  
  # Setup ejs views as default, with .html as the extension
  app.set 'views', "#{__dirname}/views"
  #app.register('.html', require('ejs'));
  app.set 'view engine', 'jade'

  # Some dynamic view helpers
  app.dynamicHelpers 
    request: (req) -> req
    
    hasMessages: (req) ->
      if (!req.session) 
        false
      else 
        Object.keys(req.session.flash || {}).length

    messages: (req) ->
      ->
        msgs = req.flash()
        reduceFn = (arr, type) -> arr.concat( msgs[type] )
        result = Object.keys(msgs).reduce reduceFn, []


# Check authenticated 
restrict = (req, res, next) ->
  if req.session?.user
    next()
  else
    returnurl = encodeURIComponent req.url
    req.session.error = 'Access denied!'
    res.redirect "/account/login?returnurl=#{returnurl}"
  

controllerAction = (name, plural, action, fn) ->
  (req, res, next) ->
    render = res.render
    format = req.params.format
    path = "#{__dirname}/views/#{name}/#{action}.jade"      
    
    # decorate res.render function to populate extra data object for a view.  This is case, the decorator 
    # trying to populate a property with 'controller' name
    res.render = (obj, options, fn) ->
      res.render = render
      # Template path
      if typeof obj is 'string'
        return res.render obj, options, fn
      
      # Format support
      if action is 'show' and format
        if format is 'json'
          return res.send obj
        else
          throw new Error "unsupported format '#{format}'"

      # Render template
      res.render = render
      options = options || {};
      # Expose obj as the "users" or "user" local
      if action is 'index'
        options[plural] = obj
      else
        options[name] = obj
      
      res.render path, options, fn
    fn.apply this, arguments



# Load a controller module
bootController = (app, file) ->
  name = file.replace '.js', ''  # controller name
  actions = require "./controllers/#{name}"  # load a list of public actions
  plural = "#{name}s" # realistically we would use an inflection lib
  prefix = "/#{name}"; 

  # Special case for "app"
  if name is 'app'
    prefix = '/'

  Object.keys( actions )
  .map (action) ->
    routeFn = actions[action]
    methods = routeFn.methods ? ['GET']
    realaction = routeFn.action ? action
    path =  if prefix is '/' then "/#{realaction}" else "#{prefix}/#{realaction}"
    restricted = routeFn.authenticated ? false
    fn = if name is 'm' then [] else [mobileController]
    fn.push restrict if restricted      
    fn.push controllerAction( name, plural, action, routeFn )
    
    switch action
      when 'index' 
        app.get prefix, fn
        console.log "Routing GET #{prefix}"
      when 'show'
        app.get "#{prefix}/:id.:format?", fn
        console.log "Routing GET ", "#{prefix}/:id.:format?"
      when 'add' 
        app.get "#{prefix}/add", fn
        console.log "Routing GET ", "#{prefix}/add"
      when 'create' 
        app.post "#{prefix}/:id", fn
        console.log "Routing POST ", "#{prefix}"
      when 'edit' 
        app.get "#{prefix}/:id/edit", fn
        console.log "Routing GET ", "#{prefix}/:id/edit"
      when 'update' 
        app.put "#{prefix}/:id", fn
        console.log "Routing PUT ", "#{prefix}/:id"
      when 'destroy' 
        app.del "#{prefix}/:id", fn
        console.log "Routing DEL ", "#{prefix}/:id"
      else
        for method in methods
          do (method) ->
            switch method
              when 'POST'
                app.post path, fn
                console.log "Routing POST ", path
              when 'PUT'
                app.put path, fn
                console.log 'Routing PUT ', path
              when 'DEL'
                app.del path, fn
                console.log 'Routing DEL ', path
              else 
                app.get path, fn
                console.log 'Routing GET ', path
            
  

# Load all controller modules from folder controller
bootControllers = (app) ->
  fs.readdir "#{__dirname}/controllers/", (err, files) ->
    throw err if err       
    bootController app, file for file in files
      
 
exports.boot = (app) ->
  bootApplication app
  bootControllers app
