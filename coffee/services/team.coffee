teamRepo = require '../repository/teams'
newTeamRepo = require '../repository/teams2'

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



     
