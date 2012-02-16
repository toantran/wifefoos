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
