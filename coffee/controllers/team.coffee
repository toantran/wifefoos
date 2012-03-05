teamSvc = require( '../services/team' )


###
  POST
  URL  /team/challenge
  Post a challenge to server
###
exports.challenge = (req, res, next) ->
  var teamid = req.param('teamid')
    , opponentplayerid = req.param('challengerid')
    , msg = req.param('challengemsg')
    , matchtype = req.param('matchtype');
    
  if (!teamid || !opponentplayerid) {
    res.send({success: false, error: 'Ids empty'});
    return false;
  }
  
  createTeamChallenge({
    teamid: teamid
    , playerid: opponentplayerid
    , matchtype: matchtype
    , msg: msg
  }, function(error, result) {
    if (error) {
      res.send({
        success: false
        , error: error
      });
    } else {
      res.send({
        success: true
        , result: result
      });
    }
  });
  
  return true;
}
exports.challenge.authenticated = true;
exports.challenge.methods = ['POST'];


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
    console.log e
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
    console.log e
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
    console.log e
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
    return next() if err?
    
    makeMemberMapper = ->
      userSvc = require '../services/user'
      (memberid, membermapcb = ->) ->
        userSvc.getById memberid, membermapcb
      
    makeTeamMapper = ->
      (team, teammapcb = ->) ->
        return teammapcb() unless team?
        utils.mapAsync team.members, makeMemberMapper(), (err, members) ->
          return teammapcb(err) if err?
          team.members = members
          teammapcb null, team
      
    utils.mapAsync teams, makeTeamMapper(), cb
  .then (err, teams, cb = ->) ->
    return next() if err? or not teams?
    teams.sort teamSvc.sortingTeams
    
    if (availableOnly)
      res.send teams
    else
      res.render teams, layout: true, title: 'WFL - Teams'            
exports.index.authenticated = true;




