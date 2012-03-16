userSvc = require '../services/user'


exports.records = (req, res, next) ->
  playerid = req.params.id
  
  return res.send() if not playerid
  
  try
    
    userSvc.getrecords playerid, (err, records) ->
      res.send
        success: not (not (not err))
        records: records
  catch e
    console.trace e
    next e
  
exports.records.authenticated = true
exports.records.methods = ['GET']
exports.records.action = ':id/records'
  
###
  POST
  URL /profile/:id/removecomment
###
exports.removecomment = (req, res, next) ->
  userid = req.params.id
  postid = req.param 'postid', ''
  commentid = req.param 'commentid', ''
  
  return res.send() if not userid

  try
    userSvc.removeComment userid, postid, commentid, (error, comment) ->
      result = success: true
      
      if error
        result.success = false
        result.error = error
      else
        result.comment = comment
      
      res.send result    
  catch e
    console.trace e
    req.flash 'error', e
    next e
exports.removecomment.authenticated = true
exports.removecomment.methods = ['POST']
exports.removecomment.action = ':id/removecomment'


###
  POST
  URL /profile/:id/addcomment
###
exports.addcomment = (req, res, next) ->
  userid = req.params.id
  postid = req.param 'postid', ''
  posterid = req.param 'posterid', ''
  msg = req.param 'msg', ''
  comment = posterid: posterid, msg: msg
    
  try
    userSvc.addComment userid, postid, comment, (error, addedcomment) ->
      result = success: true
      
      if error
        result.success = false
        result.error = error
        res.send result
      else
        postSvc = require '../services/post'
        
        try
          postSvc.loadComment comment, (error, fullComment) ->      
            if error
              result.comment = comment
            else
              result.comment = fullComment
            res.send result
        catch e
          console.trace e
          req.flash 'error', e
          next()
  catch e
    console.trace e
    req.flash 'error', e
    next e
exports.addcomment.authenticated = true
exports.addcomment.methods = ['POST']
exports.addcomment.action = ':id/addcomment'


###
  POST
  URL /profile/:id/removepost
###
exports.removePost = (req, res, next) ->
  userid = req.params.id
  postid = req.param 'postid', ''
  
  return res.send() if not userid

  try
    userSvc.removePost userid, postid, (error, post) ->
      result = success: true
      
      if error
        result.success = false
        result.error = error
      else
        result.post = post
      
      res.send result    
  catch e
    console.trace e
    req.flash 'error', e
    next e
exports.removePost.authenticated = true
exports.removePost.methods = ['POST']
exports.removePost.action = ':id/removepost'


###
  POST
  URL /profile/:id/addpost
###
exports.addPost = (req, res, next) ->
  userid = req.params.id
  posterid = req.param 'posterid', ''
  msg = req.param 'msg', ''
  post = 
    type: 'post'
    data: 
      posterid: posterid
      msg: msg
    createdat: new Date()
  
  return res.send() if not userid

  try
    userSvc.addPost userid, post, (error, fullPost) ->
      result = success: true
      
      if error
        result.success = false
        result.error = error
      else
        postSvc = require '../services/post'
        postSvc.init()
        postSvc.makePostGen(req.user) post, (err, fullpost) -> 
          if fullpost?
            result.post = fullpost
          else
            result.post = post
          res.send result
  catch e
    console.trace e
    req.flash 'error', e
    next e
exports.addPost.authenticated = true
exports.addPost.action = ':id/addpost'
exports.addPost.methods = ['POST']

###
  GET
  URL /profile
  Redirect to /profile/show with current user id
###
exports.index = (req, res, next) ->
  userId = req?.user?._id ? ''
  
  # redirect to show with current user id
  res.redirect '/profile/' + userId

exports.index.methods = ['GET']
exports.index.authenticated = true


###
  GET
  URL /profile/show
###
exports.show = (req, res, next) ->
  playerid = req.params?.id
  
  return next() unless playerid and playerid isnt 'undefined'  
  
  
  try
    userSvc.getFullUser playerid, (err, fullplayer) ->
      if err
        req.flash 'error', err
        next err
      else
        res.render fullplayer,
          layout: true
          title: 'WFL - Profile'
  catch e
    console.trace e
    req.flash 'error', e
    next e
exports.show.methods = ['GET'];
exports.show.authenticated = true; 
