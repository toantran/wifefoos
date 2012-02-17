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

  exports.remove = function() {
    return baseRepo.remove.apply(baseRepo, arguments);
  };

  exports.getById = function() {
    return baseRepo.getById.apply(baseRepo, arguments);
  };

  exports.ObjectId = ObjectId;

  /*
  Update player's picture
  */

  exports.updatepicture = function(userid, pictureurl, callback) {
    var db, errorFn;
    if (callback == null) callback = function() {};
    db = getDb();
    errorFn = errorHandler(db, callback);
    return baseRepo.getCollection(db, function(collectionErr, collection) {
      return checkError(collectionErr, errorFn, function() {
        try {
          return collection.findAndModify({
            _id: new ObjectId(userid)
          }, {}, {
            $set: {
              pictureurl: pictureurl,
              updatedat: new Date()
            }
          }, {
            safe: true
          }, callback);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      });
    });
  };

  /*
  Add a vote record into player's record
  */

  exports.addVote = function(playerid, vote, callback) {
    var db, errorFn, logObj;
    if (callback == null) callback = function() {};
    db = getDb();
    errorFn = errorHandler(db, callback);
    logObj = {
      type: 'matchresult',
      data: {
        matchid: vote.matchid,
        teamid: vote.teamid
      },
      createdat: new Date()
    };
    return baseRepo.getCollection(db, function(collectionErr, collection) {
      return checkError(collectionErr, errorFn, function() {
        return collection.findAndModify({
          _id: new ObjectId(playerid)
        }, {}, {
          $addToSet: {
            votes: vote,
            logs: logObj
          },
          $set: {
            updatedat: new Date()
          }
        }, {
          safe: true
        }, callback);
      });
    });
  };

  exports.getByUsername = function(username, callback) {
    if (callback == null) callback = function() {};
    if (!username) return callback('Invalid username');
    console.log('Outside read ', baseRepo);
    return baseRepo.read({
      username: username
    }, function(err, users) {
      if ((!(err != null)) && (users != null ? users.length : void 0)) {
        return callback(null, users[0]);
      } else {
        return callback(err, users);
      }
    });
  };

}).call(this);
