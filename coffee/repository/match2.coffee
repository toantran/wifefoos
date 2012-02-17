baseDb = require('./base')
baseRepo = new baseDb.repository('matches')

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
