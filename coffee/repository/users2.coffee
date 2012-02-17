#baseDb = require './base'
#baseDb.setCollectionName 'users'
#{getDb, checkError, getCollection, errorHandler, create, read, update, remove, getById, ObjectId} = baseDb
#[exports.create, exports.read, exports.update, exports.remove, exports.getById, exports.ObjectId] = [create, read, update, remove, getById, ObjectId]

baseDb = require('./base')
baseRepo = new baseDb.repository('users')

{Db, ObjectId, Timestamp, Connection, Server, checkError, errorHandler, getDb} = baseDb

exports.create = () ->
  baseRepo.create.apply baseRepo, arguments
exports.read = () ->
  baseRepo.read.apply baseRepo, arguments
exports.update = () ->
  baseRepo.update.apply baseRepo, arguments
exports.remove = () ->
  baseRepo.remove.apply baseRepo, arguments
exports.getById = () ->
  baseRepo.getById.apply baseRepo, arguments
exports.ObjectId = ObjectId

###
Update player's picture
###
exports.updatepicture = (userid, pictureurl, callback = ->) ->
  db = getDb()
  errorFn = errorHandler db, callback   

  baseRepo.getCollection db, (collectionErr, collection) ->
    checkError collectionErr, errorFn, ->
      try 
        collection.findAndModify _id: new ObjectId(userid), {}, {
          $set:  
            pictureurl: pictureurl
            updatedat: new Date()
        }, safe: true, callback
      catch e
        console.trace e
        callback e      


###
Add a vote record into player's record
###
exports.addVote = (playerid, vote, callback = ->) ->
  db = getDb()
  errorFn = errorHandler db, callback
  logObj = 
    type: 'matchresult'
    data: 
      matchid: vote.matchid
      teamid: vote.teamid
    createdat: new Date()

  baseRepo.getCollection db, (collectionErr, collection) ->
    checkError collectionErr, errorFn, ->
      collection.findAndModify
        _id: new ObjectId(playerid)
        , {}, 
          $addToSet:  
            votes: vote
            logs: logObj
          $set: 
            updatedat: new Date()
        , safe: true
        , callback
   

exports.getByUsername = (username, callback = ->) ->
  return callback('Invalid username') unless username
  
  console.log 'Outside read ', baseRepo
  baseRepo.read username: username, (err, users) ->
    if (not err?)  and users?.length
      callback null, users[0]  
    else      
      callback err, users      
      
      
