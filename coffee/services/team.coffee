teamRepo = require '../repository/teams'

exports.cancelMatch = (teamid, match, callback = ->) ->
  return callback() unless teamid? and teamid isnt 'undefined' and match? and match isnt 'undefined'
  teamRepo.cancelMatch teamid, match, callback  
  
exports.updateStats = (teamid, opponentid, win, callback = ->) ->
  teamid = String teamid if typeof teamid isnt 'string'
  opponentid = String opponentid if typeof opponentid isnt 'string'
  teamRepo.updateStats teamid, opponentid, win, callback 
  
exports.setMatchComplete = (teamid, matchid, callback = ->) ->
  teamid = String teamid if typeof teamid isnt 'string'
  matchid = String matchid if typeof matchid isnt 'string'
  teamRepo.completeMatch teamid, matchid, callback
  
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



     
