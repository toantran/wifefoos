matchRepo = require('../repository/matches')

exports.getPendingExpiredMatches = (callback) ->
  query = 
    status: 'pending'
    end:
      $lt: new Date()
  
  try
    matchRepo.query query, callback
  catch e
    console.log e
    throw e
    
exports.setStatus = (matchid, status, callback = ->) ->
  matchid = String matchid if typeof matchid isnt 'string'
  matchRepo.setStatus matchid, status, callback
