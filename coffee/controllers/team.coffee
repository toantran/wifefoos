teamSvc = require( '../services/team' )


exports.join = (req, res, next) ->
  teamid = req.param 'id', ''
  userid = req.param 'playerid', ''
  
  if teamid and userid
    try
      teamSvc.createJoinRequest teamid, userid, (err) ->
        res.send 
          success: not err?
    catch e
      console.trace e
      next e
  else
    next 'ids cannot be empty or 0'
exports.join.authenticated = true
exports.join.methods = ['POST']  
exports.join.action = ':id/join'


###
  POST
  URL  /team/challenge
  Post a challenge to server
###
exports.challenge = (req, res, next) ->
  teamid = req.param 'challengeeteamid', ''
  opponentplayerid = req.param 'challengerid', ''
  msg = req.param 'challengemsg', ''
  matchtype = req.param 'matchtype', ''
    
  if not teamid or not opponentplayerid
    res.send 
      success: false
      error: 'Ids empty'
  else  
    try
      teamSvc.createTeamChallenge {teamid, opponentplayerid, matchtype, msg }, (error, result) =>
        if error
          res.send
            success: false
            error: error
        else 
          res.send
            success: true
            result: result
    catch e
      console.trace e
      next e
exports.challenge.authenticated = true
exports.challenge.methods = ['POST']


###
  POST
  URL /team/challengedecline
  Decline a challenge
###
exports.challengedecline = (req, res) ->
  inputs = 
    challengingteamid : req.param 'challengingteamid', ''
    challengedteamid : req.param 'challengedteamid', ''
    msg : req.param 'messsage', ''
  
  try
    if inputs.challengingteamid and inputs.challengedteamid    
      teamSvc.declineChallenge inputs, (error, result) ->
        res.send 
          success: not error
          error: error
          result: result
    else
      res.send
        success: false
        error: 'Ids empty'
  catch e
    console.trace e
    res.send
      success: false
      error: e
exports.challengedecline.methods = ['POST']
exports.challengedecline.authenticated = true



###
  POST
  URL /team/challengeaccept
  Accept a challenge, create pending match
###
exports.challengeaccept = (req, res, next) ->
  inputs = 
    challengingteamid : req.param 'challengingteamid'
    challengedteamid : req.param 'challengedteamid'
    msg : req.param('messsage')
  
  try
    if inputs.challengingteamid and inputs.challengedteamid
      teamSvc.acceptChallenge inputs, (error, result) ->
        res.send
          success: new Boolean(!error)
          error: error
          result: result
    else
      res.send
        success: false
        error: 'Ids empty'
  catch e
    console.trace e
    res.send 
      success: false
      error: e
exports.challengeaccept.methods = ['POST']
exports.challengeaccept.authenticated = true


###
  POST
  URL /team/challengecancel
  Cancel a challenge
###
exports.challengecancel = (req, res) ->
  inputs = 
    challengingteamid : req.param 'challengingteamid', ''
    challengedteamid : req.param 'challengedteamid', ''
    msg : req.param 'messsage', ''
  
  try
    if inputs.challengingteamid and inputs.challengedteamid
      teamSvc.cancelChallenge inputs, (error, result) ->
        res.send 
          success: not error
          error: error
          result: result
    else
      res.send
        success: false
        error: 'Ids empty'
  catch e
    console.trace e
    res.send 
      success: false
      error: e
exports.challengecancel.methods = ['POST']
exports.challengecancel.authenticated = true



###
  GET
  URL /team/challenge
  return a challenge object
###
exports.getChallenge = (req, res, next) ->
  teamid = req.param 'teamid', ''
  challengerid = req.param 'challengerid', ''
  
  if not teamid or not challengerid
    return res.send( success: false, error: 'Ids empty' )   
  try
    teamSvc.getTeamChallenge teamid, challengerid, (error, result) ->
      if error?
        res.send 
          success: false 
          error: error 
      else            
        res.send 
          success: true
          result: result
  catch e
    console.trace e
    res.send 
      success: false
      error: e      
exports.getChallenge.authenticated = true
exports.getChallenge.action = 'challenge'
exports.getChallenge.methods = ['GET']


###
  GET
  URL /team
  Render team list page
###
exports.index = (req, res, next) ->
  availableOnly = req.param 'available', ''
  utils = require '../services/utils'
  
  utils.execute( teamSvc.getAll, availableOnly )  # get all teams
  .then (err, teams, cb = ->) ->
    return next( err ) if err
    
    makeMemberMapper = ->
      userSvc = require '../services/user'
      (memberid, membermapcb = ->) ->
        userSvc.getById memberid, membermapcb
      
    makeTeamMapper = ->
      (team, teammapcb = ->) ->
        return teammapcb() unless team?
        utils.mapAsync team?.members, makeMemberMapper(), (err, members) ->
          return teammapcb(err) if err
          team.members = members
          teammapcb null, team
      
    utils.mapAsync teams, makeTeamMapper(), cb
  .then (err, teams, cb = ->) ->
    return next(err) if err or not teams?
    teams.sort teamSvc.sortingTeams
    
    if (availableOnly)
      res.send teams
    else
      res.render teams, layout: true, title: 'WFL - Teams'            
exports.index.authenticated = true;


###
  POST
  URL /team/:id
  Create a team
###
exports.create = (req, res, next) ->
  userId = req.params.id || req.user._id
  teamname = req.body.teamname
  utils = require '../services/utils'
  userSvc = require '../services/user'

  team = 
    teamname: teamname
    owner: userId
    pictureurl: '/images/the-a-team.jpg'
    members: [userId]
  
  utils.execute( teamSvc.create, team )
  .then (error, createdteam, cb = ->) ->
    if error
      req.flash 'error', error
      res.send 
        success: false
        error: error
    else if not team?
      req.flash 'error', 'Could not create team'
      res.send
        success: false
        error: 'Could not create team'
    else 
      userSvc.assignTeam userId, team, cb
  .then (err, user, cb = ->) ->
      if String(userId) is String(req.user._id)
        userSvc.getById userId, cb
      else
        res.send
          success: true
          
  .then (err, @user, cb = ->) =>
    if not err? 
      req.session?.regenerate cb
    else
      res.send
        success: true
  .then ->
    req.session.user = @user
    res.send
      success: true
exports.create.authenticated = true


###
  GET
  URL /team/:id
  Render a team detail page
###
exports.show = (req, res, next) ->
  teamId = req.params.id
  
  teamSvc.getById teamId, (error, team) ->
    if error
      req.flash 'error', error
    res.render team, 
      layout: true
      title: 'WFL - Team'
      user: req.session.user
exports.show.authenticated = true 

