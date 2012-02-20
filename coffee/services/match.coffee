matchRepo = require('../repository/matches2')

exports.getPendingExpiredMatches = (callback) ->
  query = 
    status: 'pending'
    end:
      $lt: new Date()
  
  try
    matchRepo.read query, callback
  catch e
    console.log e
    throw e
    
exports.setStatus = (matchid, status, callback = ->) ->
  console.assert matchid, 'matchid cannot be null or 0'  
  throw 'matchid is null or empty' unless matchid?

  matchid = new matchRepo.ObjectId( matchid ) if typeof matchid is 'string'
  findObj = _id : matchid
  updateObj = 
    $set: 
      status: status
      updatedat: new Date()
  
  try
    matchRepo.update findObj, updateObj, callback  
  catch e
    console.trace e
    callback e
