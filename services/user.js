(function() {
  var crypto, hash, loadChallenge, loadChallenges, loadMatch, loadMatches, loadUserTeam, teamRepo, userRepo, utils;

  crypto = require('crypto');

  userRepo = require('../repository/users');

  teamRepo = require('../repository/teams');

  utils = require('utils');

  hash = function(msg, key) {
    return crypto.createHmac('sha256', key).update(msg).digest('hex');
  };

  loadChallenge = function(challenge, callback) {
    if (challenge == null) return callback();
    if (challenge.teamid != null) {
      return teamRepo.getSimpleTeam(String(challenge.teamid), function(err, team) {
        var _ref;
        challenge.teamname = (_ref = team != null ? team.teamname : void 0) != null ? _ref : 'Unknown';
        return callback(null, challenge);
      });
    } else {
      return callback(null, challenge);
    }
  };

  loadChallenges = function(challenges, callback) {
    if (!((challenges != null) && challenges.length !== 0)) {
      return callback(null, challenges);
    }
    return utils.map(challenges, loadChallenge, callback);
  };

  loadMatch = function(hometeamid, m, callback) {
    var team, _i, _len, _ref, _ref2;
    if ((m != null ? (_ref = m.teams) != null ? _ref.length : void 0 : void 0) !== 0) {
      _ref2 = m.teams;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        team = _ref2[_i];
        if (team != null ? team._id.equals(hometeamid) : void 0) {
          m.opponentteamid = team._id;
          m.opponentteamname = team.teamname;
        }
      }
    }
    return callback(null, m);
  };

  loadMatches = function(hometeamid, matches, callback) {
    if (!((matches != null) && matches.length !== 0)) {
      return callback(null, matches);
    }
    return utils.map(matches, function(m, cb) {
      return loadMatch(hometeamid, m, cb);
    }, callback);
  };

  loadUserTeam = function(teamid, callback) {
    if (!((teamid != null) && teamid !== 'undefined')) return callback();
    return teamRepo.getFullTeam(String(teamid), function(err, team) {
      var __loadChallengesFn, __loadMatchesFn;
      if ((err != null) || !(team != null)) return callback(err);
      __loadChallengesFn = function(lc_cb) {
        return loadChallenges(team.challenges, function(lc_err, challenges) {
          if (lc_err == null) team.challenges = challenges;
          return lc_cb(err, challenges);
        });
      };
      __loadMatchesFn = function(lm_cb) {
        return loadMatches(team._id, team.matches, function(lm_err, matches) {
          if (lm_err == null) team.matches = matches;
          return lm_cb(err, matches);
        });
      };
      return utils.parallel([__loadChallengesFn, __loadMatchesFn], function(parallel_err, results) {
        return callback(err, team);
      });
    });
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
            console.dir(user.matches);
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
