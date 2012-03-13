teamsvc = require './team'
usersvc = require './user'
matchsvc = require './match'
utils = require './utils'
jade = require 'jade'
fs = require 'fs'
templates = {}


bootTemplate = (file) ->
  path = "#{__dirname}/../views/post/#{file}"
  name = file.replace '.jade', ''  # template name
  str = fs.readFileSync(path, 'utf8')
  fn = jade.compile str, 
    filename: path
    pretty: true  
  templates[name] = fn
        
  
# Load all post templates from folder view/post
bootTemplates = () ->
  fs.readdir "#{__dirname}/../views/post/", (err, files) ->
    throw err if err       
    bootTemplate file for file in files when file.indexOf('.jade') >= 0
    

bootTemplates()


exports.init = ->
  

exports.loadComment = loadComment = (comment, callback = ->) ->
  usersvc.getById comment?.posterid, (err, user) ->
    comment?.pictureurl = user?.pictureurl
    comment?.postername = user?.nickname
    callback null, comment 
    

exports.makePostGen = (user) ->
  (post, callback = ->) ->
    return callback(null, post) unless post?
    
    setPictureUrl = (pictureurl) ->
      post.pictureurl = pictureurl
      
    setDesc = (desc) ->
      post.desc = desc
    
    returnback = (err) ->
      if err
        callback err, post
      else
        if post?.comments?.length
          utils.mapAsync post?.comments, loadComment, (commentErr, comments) ->
            post?.comments = comments
            callback commentErr, post
        else
          callback null, post
      
    data = 
      playerid: user?._id
      playername: user?.nickname        

    genDesc = () ->
      if templates[post?.type]?
        setDesc templates[post?.type](data)
    
    switch post.type
      when 'jointeam'
        setPictureUrl user.pictureurl
        teamsvc.getById post?.data?.teamid, (err, team) ->
          data.teamid = team?._id
          data.teamname = team?.teamname
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
      when 'invite'
        utils.execute( usersvc.getById, post?.data?.playerid) 
        .then (err, otherplayer, cb = ->) ->
          return returnback(err) if err
          
          setPictureUrl otherplayer?.pictureurl
          
          data.otherplayerid = otherplayer?._id
          data.otherplayername = otherplayer?.nickname
          
          teamsvc.getById post?.data?.teamid, cb
          
        .then (err, team, cb = ->) ->
          return returnback(err) if err
          data.teamid = team?._id
          data.teamname = team?.teamname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
      
      when 'teamjoin'
        teamsvc.getById post?.data?.teamid, (err, team) ->
          return returnback(err) if err
          
          setPictureUrl team?.pictureurl
          data.teamid = team?._id
          data.teamname = team?.teamname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
            
      when 'recruit'
        setPictureUrl user?.pictureurl
        usersvc.getById post?.data?.playerid, (err, otherplayer) ->
          return returnback(err) if err
          
          data.otherplayerid = otherplayer?._id
          data.otherplayername = otherplayer?.nickname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
            
      when 'newteam'
        setPictureUrl user?.pictureurl

        teamsvc.getById post?.data?.teamid, (err, team) ->
          return returnback(err) if err
          
          data.teamid = team?._id
          data.teamname = team?.teamname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
      when 'challengecancelled'
        teamsvc.getById post?.data?.teamid, (err, team) ->
          return returnback(err) if err
          
          setPictureUrl team?.pictureurl
          data.teamid = team?._id
          data.teamname = team?.teamname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
            
      when 'teamchallenging', 'challengedeclined', 'challengedeclining', 'challengeremoved', 'challengecancelling'
        setPictureUrl user?.pictureurl
        
        data.matchtype = post?.data?.matchtype
        data.matchmsg = post?.data?.msg

        teamsvc.getById post?.data?.teamid, (err, team) ->
          return returnback(err) if err
          
          data.teamid = team?._id
          data.teamname = team?.teamname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
               
      when 'teamchallenged'
        data.matchtype = post?.data?.matchtype
        data.matchmsg = post?.data?.msg
        
        teamsvc.getById post?.data?.teamid, (err, team) ->
          return returnback(err) if err
          
          setPictureUrl team?.pictureurl
          data.teamid = team?._id
          data.teamname = team?.teamname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
        
      when 'newmatch'
        setPictureUrl '/images/match.jpg'
        
        matchsvc.getById post.data.matchid, (err, am) ->
          return returnback(err) if err
          
          data.teamid = am?.teams[0]?._id
          data.teamname = am?.teams[0]?.teamname
          data.otherteamid = am?.teams[1]?._id
          data.otherteamname = am?.teams[1]?.teamname
          data.expirationdt = am?.end
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
            
      when 'post'
        data.postbody = post?.data?.msg
        
        usersvc.getById post?.data?.posterid, (err, poster) ->
          return returnback(err) if err

          setPictureUrl poster?.pictureurl          
          data.playerid = poster?._id
          data.playername = poster?.nickname
          
          try
            genDesc()          
            returnback null
          catch e
            console.trace e
            returnback e
      
      when 'matchresult'
        setPictureUrl user?.pictureurl
        data.result = post?.data?.result
        
        teamsvc.getById post?.data?.opponentid, (err, team) ->
          return returnback(err) if err
          
          setPictureUrl team?.pictureurl
          data.teamid = team?._id
          data.teamname = team?.teamname
          
          try
            genDesc()
            returnback null
          catch e
            console.trace e
            returnback e
    
      else
        setPictureUrl user?.pictureurl
        setDesc 'N/A'
        returnback null
        

