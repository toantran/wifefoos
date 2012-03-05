newTeamRepo = require '../repository/teams2'
utils = require './utils'
userSvc = require './user'
matchSvc = require './match'


exports.addMatch = addMatch = (teamid, am, callback = ->) ->
  

exports.acceptChallenge = (inputs, callback = ->) ->
  console.assert inputs?, 'inputs cannot be null'
  throw 'Inputs cannot be null' unless inputs?
  
  teamids = [inputs.challengingteamid, inputs.challengedteamid]
    
  utils.execute( utils.mapAsync, teamids, newTeamRepo.getById )  # get all teams
  .then (err, @teams, cb = ->) =>
    # create match
    return callback(err) if err
    start = new Date()
    end = new Date()
    am = 
      start: start
      end: new Date(end.setDate( end.getDate() + 3 ))  # ends after 3 days
      status: 'pending'
      teams: teams
    matchSvc.createMatch am, cb
  .then (err, @am, cb = ->) =>
    return callback(err) if err
    # add match to teams
    utils.mapAsync @teams, (team, cb) -> 
      addMatch( team._id, @am, cb )
    , cb
  .then (err, args..., cb = ->) ->
    return callback(err) if err
    # remove the challenge from both teams
    newTeamRepo.removeChallenge inputs.challengedteamid, inputs.challengingteamid
    newTeamRepo.removeChallenge inputs.challengingteamid, inputs.challengedteamid
    cb()
  .then (err, args..., cb = ->) ->
    return callback(err) if err
    for team in @teams
      do (team) ->
        utils.mapAsync team.members, (memberid, mapcb = ->) ->
          post = 
            type: 'newmatch'
            data: 
              matchid: String(@am._id)
            createdat: new Date()
            
          userSvc.addPost memberid, post, mapcb
        , cb
    callback()
      

exports.cancelChallenge = (inputs, callback = ->) ->  
  console.assert inputs?, 'inputs cannot be null'
  throw 'Inputs cannot be null' unless inputs?

  utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid)
  .then (err, others..., cb = ->) ->
    return callback(err) if err
    newTeamRepo.getById inputs.challengingteamid, cb
  .then (err, team, cb = ->) ->
    return callback(err) if err
    if Array.isArray(team?.members)
      for member in team.members
        do ( member ) ->
          post = 
            type: 'challengecancelling'
            data: 
              teamid: inputs.challengedteamid
              msg: 'Chicken dance'
            createdat: new Date()
          userSvc.addPost member._id, post
    cb()
  .then (err, args..., cb = ->) ->   
    return callback(err) if err
    newTeamRepo.removeChallenge inputs.challengedteamid, inputs.challengingteamid, cb
  .then (err, others..., cb = ->) ->
    return callback(err) if err
    newTeamRepo.getById inputs.challengedteamid, cb
  .then (err, team, cb = ->) ->
    return callback(err) if err
    if Array.isArray(team?.members)
      for member in team.members
        do (member) ->
          post = 
            type: 'challengecancelled'
            data: 
              teamid: inputs.challengingteamid
              msg: 'Chicken dance'
            createdat: new Date()
          userSvc.addPost member._id, post
    cb()
    

exports.declineChallenge = (inputs, callback = ->) ->  
  console.assert inputs?, 'inputs cannot be null'
  throw 'Inputs cannot be null' unless inputs?

  utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid)
  .then (err, others..., cb = ->) ->
    return callback(err) if err
    newTeamRepo.getById inputs.challengingteamid, cb
  .then (err, team, cb = ->) ->
    return callback(err) if err
    if Array.isArray(team?.members)
      for member in team.members
        do ( member ) ->
          post = 
            type: 'challengedeclined'
            data: 
              teamid: inputs.challengedteamid
              msg: 'Chicken dance'
            createdat: new Date()
          userSvc.addPost member._id, post
    cb()
  .then (err, args..., cb = ->) ->   
    return callback(err) if err
    newTeamRepo.removeChallenge inputs.challengedteamid, inputs.challengingteamid, cb
  .then (err, others..., cb = ->) ->
    return callback(err) if err
    newTeamRepo.getById inputs.challengedteamid, cb
  .then (err, team, cb = ->) ->
    return callback(err) if err
    if Array.isArray(team?.members)
      for member in team.members
        do (member) ->
          post = 
            type: 'challengedeclining'
            data: 
              teamid: inputs.challengingteamid
              msg: 'Chicken dance'
            createdat: new Date()
          userSvc.addPost member._id, post
    cb()
      
      
exports.cancelMatch = (teamid, matchid, callback = ->) ->
  return callback() unless teamid? and teamid isnt 'undefined' and matchid? and matchid isnt 'undefined'
  
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  matchid = new newTeamRepo.ObjectId(matchid) if typeof matchid is 'string'
  
  findObj = 
    _id: teamid
  updateObj =
    $pull: 
      matches: 
        _id: matchid
    $set: 
      updatedat: new Date()
  
  try
    newTeamRepo.update findObj, updateObj, callback  
  catch e
    console.trace e
    callback e  
  

exports.resetStats = (teamid, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  teamid = new newTeamRepo.ObjectId( teamid ) if typeof teamid is 'string'
  findObj = _id : teamid
  updateObj = 
    $unset: 
      stats: 1
    
  try
    newTeamRepo.update findObj, updateObj, callback
  catch e
    console.trace e
    callback e 
  
  
exports.updateStats = (teamid, opponentid, win, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  teamid = new newTeamRepo.ObjectId( teamid ) if typeof teamid is 'string'
  opponentid = String opponentid if typeof opponentid isnt 'string'
  findObj = _id : teamid
  incObj = if win then {'stats.win':1} else {'stats.loss': 1}
  statLog = 
    id: new newTeamRepo.ObjectId()
    type: 'matchresult'
    data: 
      opponentid: opponentid
      result: if win then 'win' else 'lose'
    createdat: new Date()
  updateObj = 
    $inc: incObj
    $set: 
      updatedat: new Date()
    $addToSet: 
      posts: statLog
    
  try
    newTeamRepo.update findObj, updateObj, callback
  catch e
    console.trace e
    callback e
    
    
exports.updateStatsSilent = (teamid, opponentid, win, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  teamid = new newTeamRepo.ObjectId( teamid ) if typeof teamid is 'string'
  opponentid = String opponentid if typeof opponentid isnt 'string'
  findObj = _id : teamid
  incObj = if win then {'stats.win':1} else {'stats.loss': 1}
  statLog = 
    id: new newTeamRepo.ObjectId()
    type: 'matchresult'
    data: 
      opponentid: opponentid
      result: if win then 'win' else 'lose'
    createdat: new Date()
  updateObj = 
    $inc: incObj
    
  try
    newTeamRepo.update findObj, updateObj, callback
  catch e
    console.trace e
    callback e            
  
  
exports.setMatchComplete = (teamid, am, callback = ->) ->
  return callback() unless teamid? and teamid isnt 'undefined' and am? and am isnt 'undefined'
  
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  matchid = am._id
  
  findObj = 
    _id: teamid
  updateObj =
    $addToSet: 
      completematches: am
    $pull: 
      matches:  
        _id: matchid
    $set: 
      updatedat: new Date()
  
  try
    newTeamRepo.update findObj, updateObj, callback  
    #callback()
  catch e
    console.trace e
    callback e 
  
  
  
  
exports.sortingTeams = (team1, team2) ->
  win1 = team1?.stats?.win ? 0
  loss1 = team1?.stats?.loss ? 0
  total1 = win1 + loss1
  avg1 = if total1 then (win1 / total1) else 0
  win2 = team2?.stats?.win ? 0
  loss2 = team2?.stats?.loss ? 0
  total2 = win2 + loss2
  avg2 = if total2 then (win2 / total2) else 0
    
  if avg1 isnt avg2
    -avg1 + avg2
  else if win1 isnt win2
    -win1 + win2
  else
    loss1 - loss2



exports.getAll = (availableOnly, callback = ->) -> 
  query = {}
  
  if availableOnly
    query = 
      '$or': [{members: null}, {members: {$size: 0}}, {members: {$size: 1}}]
  try
    newTeamRepo.read query, (readErr, cursor) ->
      if readErr?
        callback readErr
      else if cursor?
        cursor.toArray callback
      else
        callback()
        
  catch e
    console.log e
    throw e


exports.getById = (teamid, callback = ->) -> 
  console.assert teamid, 'TeamId cannot be null or 0'
  throw 'TeamId cannot be null or 0' unless teamid
  
  newTeamRepo.getById teamid, callback
  
  
    
    
    
    
