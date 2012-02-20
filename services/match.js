(function() {
  var matchRepo;

  matchRepo = require('../repository/matches2');

  exports.getPendingExpiredMatches = function(callback) {
    var query;
    query = {
      status: 'pending',
      end: {
        $lt: new Date()
      }
    };
    try {
      return matchRepo.read(query, callback);
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  exports.setStatus = function(matchid, status, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(matchid, 'matchid cannot be null or 0');
    if (matchid == null) throw 'matchid is null or empty';
    if (typeof matchid === 'string') matchid = new matchRepo.ObjectId(matchid);
    findObj = {
      _id: matchid
    };
    updateObj = {
      $set: {
        status: status,
        updatedat: new Date()
      }
    };
    try {
      return matchRepo.update(findObj, updateObj, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

}).call(this);
