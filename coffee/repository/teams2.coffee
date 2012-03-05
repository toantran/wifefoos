baseDb = require('./base')
baseRepo = new baseDb.repository('teams')

{Db, ObjectId, Timestamp, Connection, Server, checkError, errorHandler, getDb} = baseDb

exports.create = () ->
  baseRepo.create.apply baseRepo, arguments
exports.read = () ->
  baseRepo.read.apply baseRepo, arguments
exports.update = () ->
  baseRepo.update.apply baseRepo, arguments
exports.save = () ->
  baseRepo.save.apply baseRepo, arguments  
exports.remove = () ->
  baseRepo.remove.apply baseRepo, arguments
exports.getById = () ->
  baseRepo.getById.apply baseRepo, arguments
exports.ObjectId = ObjectId


exports.removeChallenge = ( teamid, otherteamid, callback = ->) ->
  console.assert teamid, 'teamid cannot be null'
  throw 'teamid cannot be null' if not teamid  
  console.assert otherteamid, 'otherteamid cannot be null'
  throw 'otherteamid cannot be null' if not otherteamid
  
  teamid = new ObjectId(teamid) if typeof teamid is 'string'
  otherteamid = new ObjectId(otherteamid) if typeof otherteamid is 'string'  
  
  findObj = 
    _id: teamid
  removingLog = 
    type: 'challengeremoved'
    data: 
      teamid: otherteamid
    createdat: new Date()
  updateObj = 
    $set:
      updatedat: new Date()
    $pull:
      challenges:
        teamid: otherteamid
    $addToSet:
      logs: removingLog

  try
    baseRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    callback e
