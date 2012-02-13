(function() {
  var crypto, hash, userRepo;

  crypto = require('crypto');

  userRepo = require('../repository/users');

  hash = function(msg, key) {
    return crypto.createHmac('sha256', key).update(msg).digest('hex');
  };

  exports.authenticate = function(username, password, callback) {
    var encryptedPassword;
    console.assert(username, 'username cannot be null or empty');
    if (username == null) throw 'username is null or empty';
    encryptedPassword = hash(password, 'a little dog');
    return userRepo.getUser(username, function(error, user) {
      if (error) {
        return callback(error);
      } else if (!user) {
        return callback('User not found');
      } else if (encryptedPassword === user.password) {
        return callback(null, true, user);
      } else {
        return callback(null, false);
      }
    });
  };

  exports.loadMobileUser = function(userid, callback) {
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    try {
      return userRepo.getFullUser(userid, function(error, user) {
        if (error) {
          return callback(error);
        } else {
          return callback(null, user);
        }
      });
    } catch (e) {
      console.log(e);
      return callback(e);
    }
  };

}).call(this);
