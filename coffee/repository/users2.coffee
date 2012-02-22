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
exports.save = () ->
  baseRepo.save.apply baseRepo, arguments  
exports.remove = () ->
  baseRepo.remove.apply baseRepo, arguments
exports.getById = () ->
  baseRepo.getById.apply baseRepo, arguments
exports.ObjectId = ObjectId
   

exports.getByUsername = (username, callback = ->) ->
  return callback('Invalid username') unless username
  
  baseRepo.read username: username, (err, cursor) ->
    if err?
      callback err
    else if cursor?
      cursor.toArray (toArrayErr, users) ->
        if toArrayErr?
          callback toArrayErr
        else if users?.length
          callback null, users[0]
        else
          callback 'User not found'
    else
      callback 'DB read failed'
      
