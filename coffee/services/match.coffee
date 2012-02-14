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
