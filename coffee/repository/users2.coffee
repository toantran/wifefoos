baseDb = require('./base')
baseRepo = new baseDb.Repository('users')

{Db, ObjectId, Timestamp, Connection, Server} = baseDb

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
exports.closeDb = () ->
  baseRepo.closeDb.apply baseRepo, arguments
   

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
          callback null, null
        cursor.close()
    else
      callback 'DB read failed'
      
