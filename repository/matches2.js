(function() {
  var Connection, Db, ObjectId, Server, Timestamp, baseDb, baseRepo, checkError, errorHandler, getDb;

  baseDb = require('./base');

  baseRepo = new baseDb.repository('matches');

  Db = baseDb.Db, ObjectId = baseDb.ObjectId, Timestamp = baseDb.Timestamp, Connection = baseDb.Connection, Server = baseDb.Server, checkError = baseDb.checkError, errorHandler = baseDb.errorHandler, getDb = baseDb.getDb;

  exports.create = function() {
    return baseRepo.create.apply(baseRepo, arguments);
  };

  exports.read = function() {
    return baseRepo.read.apply(baseRepo, arguments);
  };

  exports.update = function() {
    return baseRepo.update.apply(baseRepo, arguments);
  };

  exports.save = function() {
    return baseRepo.save.apply(baseRepo, arguments);
  };

  exports.remove = function() {
    return baseRepo.remove.apply(baseRepo, arguments);
  };

  exports.getById = function() {
    return baseRepo.getById.apply(baseRepo, arguments);
  };

  exports.ObjectId = ObjectId;

}).call(this);
