(function() {
  var Connection, Db, ObjectId, Server, Timestamp, baseDb, baseRepo, checkError, errorHandler, getDb;

  baseDb = require('./base');

  baseRepo = new baseDb.repository('users');

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

  exports.getByUsername = function(username, callback) {
    if (callback == null) callback = function() {};
    if (!username) return callback('Invalid username');
    return baseRepo.read({
      username: username
    }, function(err, cursor) {
      if (err != null) {
        return callback(err);
      } else if (cursor != null) {
        return cursor.toArray(function(toArrayErr, users) {
          if (toArrayErr != null) {
            return callback(toArrayErr);
          } else if (users != null ? users.length : void 0) {
            return callback(null, users[0]);
          } else {
            return callback(null, null);
          }
        });
      } else {
        return callback('DB read failed');
      }
    });
  };

}).call(this);
