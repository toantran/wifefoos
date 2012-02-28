(function() {
  var matchSvc, processMatch, removeMatch, teamSvc, updateMatchScore, userSvc, utils;

  matchSvc = require('./services/match');

  teamSvc = require('./services/team');

  userSvc = require('./services/user');

  utils = require('./services/utils');

  updateMatchScore = function(m, callback) {
    if (callback == null) callback = function() {};
    return matchSvc.finalizeSilent(m, callback);
  };

  removeMatch = function(m, callback) {
    if (callback == null) callback = function() {};
    return matchSvc.cancel(m, callback);
  };

  processMatch = function(m) {
    var _ref, _ref2;
    if (m == null) return;
    console.log(m.status, m.start, m.end, (_ref = m.votes) != null ? _ref.length : void 0);
    if (m != null ? (_ref2 = m.votes) != null ? _ref2.length : void 0 : void 0) {
      return updateMatchScore(m);
    }
  };

  try {
    utils.seriesAsync([
      function(val, cb) {
        if (cb == null) cb = function() {};
        console.time('Getting all players');
        return userSvc.getAllPlayers(function(err, players) {
          console.timeEnd('Getting all players');
          if (players != null) {
            return utils.mapAsync(players, function(player, iteratorCb) {
              console.time("Reset player " + player._id + " stats");
              return userSvc.resetStats(player._id, function() {
                console.timeEnd("Reset player " + player._id + " stats");
                return iteratorCb.apply(null, arguments);
              });
            }, cb);
          }
        });
      }, function(val, cb) {
        if (cb == null) cb = function() {};
        console.time('Getting all teams');
        return teamSvc.getAllTeams(function(err, teams) {
          console.timeEnd('Getting all teams');
          if (teams != null) {
            return utils.mapAsync(teams, function(team, iteratorCb) {
              console.time("Reset team " + team._id + " stats");
              return teamSvc.resetStats(team._id, function() {
                console.timeEnd("Reset team " + team._id + " stats");
                return iteratorCb.apply(null, arguments);
              });
            }, cb);
          }
        });
      }, function(val, cb) {
        if (cb == null) cb = function() {};
        console.time('Getting complete matches');
        return matchSvc.getCompleteMatches(function(error, matches) {
          var m, _i, _len;
          console.timeEnd('Getting complete matches');
          if (error) console.log('Error %s', error);
          if (matches != null) {
            for (_i = 0, _len = matches.length; _i < _len; _i++) {
              m = matches[_i];
              processMatch(m);
            }
          }
          return cb();
        });
      }
    ], null, function(err, result) {
      return console.log('DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE  ');
    });
  } catch (e) {
    console.log(e);
  }

}).call(this);
