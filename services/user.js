(function() {
  var crypto, hash, loadUserTeam, teamRepo, userRepo, utils;

  crypto = require('crypto');

  userRepo = require('../repository/users');

  teamRepo = require('../repository/teams');

  utils = require('utils');

  hash = function(msg, key) {
    return crypto.createHmac('sha256', key).update(msg).digest('hex');
  };

  loadUserTeam = function(teamid, callback) {
    if ((teamid != null) && teamid !== 'undefined') {
      return teamRepo.getFullTeam(String(teamid), callback);
    } else {
      return callback();
    }
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
        var _ref, _ref2, _ref3, _ref4, _ref5;
        if (error) {
          return callback(error);
        } else if (user) {
          user.wins = (_ref = (_ref2 = user.stats) != null ? _ref2.win : void 0) != null ? _ref : 0;
          user.losses = (_ref3 = (_ref4 = user.stats) != null ? _ref4.loss : void 0) != null ? _ref3 : 0;
          return loadUserTeam((_ref5 = user.team) != null ? _ref5._id : void 0, function(err, team) {
            var _ref6, _ref7;
            user.challenges = team != null ? team.challenges : void 0;
            user.challengeCount = (team != null ? (_ref6 = team.challenges) != null ? _ref6.length : void 0 : void 0) || 0;
            user.matches = team != null ? team.matches : void 0;
            user.matchCount = (team != null ? (_ref7 = team.matches) != null ? _ref7.length : void 0 : void 0) || 0;
            return callback(null, user);
          });
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
