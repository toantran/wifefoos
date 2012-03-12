(function() {
  var matchRepo, setStatus;

  matchRepo = require('../repository/matches2');

  exports.getById = function(matchid, callback) {
    if (callback == null) callback = function() {};
    console.assert(matchid, 'matchid cannot be null or 0');
    if (!matchid) throw 'matchid cannot be null or 0';
    try {
      return matchRepo.getById(matchid, callback);
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

  exports.createMatch = function(am, callback) {
    if (callback == null) callback = function() {};
    console.assert(am, 'Match object cannot be null');
    if (am == null) throw 'Match object cannot be null';
    return matchRepo.create(am, callback);
  };

  exports.getCompleteMatches = function(callback) {
    var query;
    if (callback == null) callback = function() {};
    query = {
      status: 'complete'
    };
    try {
      return matchRepo.read(query, function(readErr, cursor) {
        if (readErr != null) {
          return callback(readErr);
        } else if (cursor != null) {
          return cursor.toArray(callback);
        } else {
          return callback();
        }
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  exports.getPendingExpiredMatches = function(callback) {
    var query;
    query = {
      status: 'pending',
      end: {
        $lt: new Date()
      }
    };
    try {
      return matchRepo.read(query, function(readErr, cursor) {
        if (readErr != null) {
          return callback(readErr);
        } else if (cursor != null) {
          return cursor.toArray(callback);
        } else {
          return callback();
        }
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

  exports.setStatus = setStatus = function(matchid, status, callback) {
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
      return matchRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  exports.cancel = function(am, callback) {
    var makeCreatePlayersPost, makeRemoveTeamsMatch, makeSetMatchStatus, playerSvc, teamSvc, utils;
    if (callback == null) callback = function() {};
    utils = require('./utils');
    teamSvc = require('./team');
    playerSvc = require('./user');
    makeSetMatchStatus = function(status) {
      return function(m, cb) {
        console.time('Cancelling match id=%s', m._id);
        return setStatus(m._id, status, function() {
          console.timeEnd('Cancelling match id=%s', m._id);
          return cb.apply(this, arguments);
        });
      };
    };
    makeRemoveTeamsMatch = function(teams) {
      return function(m, cb) {
        var makeRemoveOneTeamMatch;
        if (cb == null) cb = function() {};
        makeRemoveOneTeamMatch = function(m) {
          return function(team, cb2) {
            if (cb2 == null) cb2 = function() {};
            console.time('Removing match from team id=%s', team._id);
            return teamSvc.cancelMatch(team._id, m, function() {
              console.timeEnd('Removing match from team id=%s', team._id);
              return cb2.apply(this, arguments);
            });
          };
        };
        console.timeEnd('Removing match from teams');
        return utils.mapAsync(teams, makeRemoveOneTeamMatch(m), function() {
          console.timeEnd('Removing match from teams');
          return cb.apply(this, arguments);
        });
      };
    };
    makeCreatePlayersPost = function(teams) {
      var players, team, _fn, _i, _len;
      players = [];
      _fn = function(team) {
        return players = players.concat(team.members);
      };
      for (_i = 0, _len = teams.length; _i < _len; _i++) {
        team = teams[_i];
        _fn(team);
      }
      return function(m, cb) {
        var makeCreateOnePlayerPost;
        if (cb == null) cb = function() {};
        makeCreateOnePlayerPost = function(m) {
          return function(playerid, cb2) {
            var post;
            if (cb2 == null) cb2 = function() {};
            post = {
              type: 'matchcancelled',
              data: {
                matchid: String(m._id)
              },
              createdat: new Date()
            };
            console.time('Creating post for player id=%s', playerid);
            return playerSvc.addPost(playerid, post, function() {
              console.timeEnd('Creating post for player id=%s', playerid);
              return cb2.apply(this, arguments);
            });
          };
        };
        console.time('Creating post for players');
        return utils.mapAsync(players, makeCreateOnePlayerPost(m), function() {
          console.timeEnd('Creating post for players');
          return cb.apply(this, arguments);
        });
      };
    };
    console.time('Match cancelling');
    return utils.seriesAsync([makeSetMatchStatus('cancelled'), makeRemoveTeamsMatch(am.teams), makeCreatePlayersPost(am.teams)], am, function(err, result) {
      console.timeEnd('Match cancelling');
      return callback.apply(this, arguments);
    });
  };

  exports.finalize = function(am, callback) {
    var count, makeSetMatchComplete, makeSetTeamMatchComplete, makeUpdatePlayerStats, makeUpdateTeamStats, maxCount, playerSvc, result, results, teamSvc, teamid, utils, _fn, _i, _len, _ref, _ref2, _ref3;
    if (callback == null) callback = function() {};
    teamSvc = require('./team');
    playerSvc = require('./user');
    utils = require('./utils');
    console.log('Counting votes');
    if ((am != null ? (_ref = am.teams) != null ? _ref.length : void 0 : void 0) !== 2) {
      return;
    }
    results = {};
    results[String(am.teams[0]._id)] = {
      count: 0,
      win: false,
      opponentid: String(am.teams[1]._id)
    };
    results[String(am.teams[1]._id)] = {
      count: 0,
      win: false,
      opponentid: String(am.teams[0]._id)
    };
    _ref2 = am.votes;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      _ref3 = _ref2[_i], teamid = _ref3.teamid, count = _ref3.count;
      results[teamid].count += count;
    }
    maxCount = Math.max(results[String(am.teams[1]._id)].count, results[String(am.teams[0]._id)].count);
    results[String(am.teams[1]._id)].win = maxCount <= results[String(am.teams[1]._id)].count;
    results[String(am.teams[0]._id)].win = maxCount <= results[String(am.teams[0]._id)].count;
    console.log('Result ');
    _fn = function(teamid, result) {
      return console.log('team %s count=%d win=%s', teamid, result.count, result.win);
    };
    for (teamid in results) {
      result = results[teamid];
      _fn(teamid, result);
    }
    makeSetMatchComplete = function() {
      return function(m, cb) {
        if (cb == null) cb = function() {};
        console.time("Set match " + m._id + " status to complete");
        return setStatus(m._id, 'complete', function(err) {
          console.timeEnd("Set match " + m._id + " status to complete");
          console.log('Set match status to complete with err %s', err != null);
          return cb.apply(this, arguments);
        });
      };
    };
    makeUpdateTeamStats = function() {
      return function(m, cb) {
        var result, teamid, _results;
        if (cb == null) cb = function() {};
        _results = [];
        for (teamid in results) {
          result = results[teamid];
          _results.push((function(teamid, result) {
            console.time("Team " + teamid + " update stats");
            return teamSvc.updateStats(teamid, result.opponentid, result.win, function(err) {
              console.timeEnd("Team " + teamid + " update stats");
              if (err != null) {
                console.log("Team " + teamid + " update stats with error " + err);
              }
              return cb.apply(this, arguments);
            });
          })(teamid, result));
        }
        return _results;
      };
    };
    makeUpdatePlayerStats = function() {
      var players, team, _fn2, _j, _len2, _ref4;
      players = [];
      _ref4 = am.teams;
      _fn2 = function(team) {
        return players = players.concat(team.members);
      };
      for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
        team = _ref4[_j];
        _fn2(team);
      }
      console.log('Player Ids = ', players);
      makeUpdatePlayerStats = function(teamidByplayerIdFn) {
        return function(playerid, cb2) {
          if (cb2 == null) cb2 = function() {};
          result = results[teamidByplayerIdFn(playerid)];
          console.log("Found result " + result + " for player " + playerid);
          console.time("Updating player " + playerid + " stats");
          return playerSvc.updateStats(playerid, result.opponentid, result.win, function() {
            console.timeEnd("Updating player " + playerid + " stats");
            return cb2.apply(this, arguments);
          });
        };
      };
      return function(m, cb) {
        var fn;
        if (cb == null) cb = function() {};
        fn = function(playerid) {
          var ids, team, _k, _len3, _ref5;
          _ref5 = am.teams;
          for (_k = 0, _len3 = _ref5.length; _k < _len3; _k++) {
            team = _ref5[_k];
            if (team.members.indexOf(playerid) >= 0) ids = team._id;
          }
          console.log("Found team " + ids + " for player " + playerid);
          return String(ids);
        };
        console.time('Updating players stats');
        return utils.mapAsync(players, makeUpdatePlayerStats(fn), function() {
          console.timeEnd('Updating players stats');
          return cb.apply(this, arguments);
        });
      };
    };
    makeSetTeamMatchComplete = function() {
      return function(m, cb) {
        var team, _fn2, _j, _len2, _ref4;
        if (cb == null) cb = function() {};
        _ref4 = am.teams;
        _fn2 = function(team) {
          console.time("Match " + am._id + " Set team " + team._id + " match complete");
          return teamSvc.setMatchComplete(team._id, am, function(err) {
            console.timeEnd("Match " + am._id + " Set team " + team._id + " match complete");
            if (err != null) {
              return console.log("Match " + am._id + " Set team " + team._id + " match complete with error " + err);
            }
          });
        };
        for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
          team = _ref4[_j];
          _fn2(team);
        }
        return cb(null);
      };
    };
    return utils.seriesAsync([makeSetMatchComplete(), makeUpdateTeamStats(), makeUpdatePlayerStats(), makeSetTeamMatchComplete()], am, function() {
      return console.log('Done!');
    });
  };

  /*
  Finalize a match, silently
  */

  exports.finalizeSilent = function(am, callback) {
    var count, makeSetMatchComplete, makeSetTeamMatchComplete, makeUpdatePlayerStats, makeUpdateTeamStats, maxCount, playerSvc, result, results, teamSvc, teamid, utils, _fn, _i, _len, _ref, _ref2, _ref3;
    if (callback == null) callback = function() {};
    teamSvc = require('./team');
    playerSvc = require('./user');
    utils = require('./utils');
    console.log('Counting votes');
    if ((am != null ? (_ref = am.teams) != null ? _ref.length : void 0 : void 0) !== 2) {
      return;
    }
    results = {};
    results[String(am.teams[0]._id)] = {
      count: 0,
      win: false,
      opponentid: String(am.teams[1]._id)
    };
    results[String(am.teams[1]._id)] = {
      count: 0,
      win: false,
      opponentid: String(am.teams[0]._id)
    };
    _ref2 = am.votes;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      _ref3 = _ref2[_i], teamid = _ref3.teamid, count = _ref3.count;
      results[teamid].count += count;
    }
    maxCount = Math.max(results[String(am.teams[1]._id)].count, results[String(am.teams[0]._id)].count);
    results[String(am.teams[1]._id)].win = maxCount <= results[String(am.teams[1]._id)].count;
    results[String(am.teams[0]._id)].win = maxCount <= results[String(am.teams[0]._id)].count;
    console.log('Result ');
    _fn = function(teamid, result) {
      return console.log('team %s count=%d win=%s', teamid, result.count, result.win);
    };
    for (teamid in results) {
      result = results[teamid];
      _fn(teamid, result);
    }
    makeSetMatchComplete = function() {
      return function(m, cb) {
        if (cb == null) cb = function() {};
        console.time("Set match " + m._id + " status to complete");
        return setStatus(m._id, 'complete', function(err) {
          console.timeEnd("Set match " + m._id + " status to complete");
          console.log('Set match status to complete with err %s', err != null);
          return cb.apply(this, arguments);
        });
      };
    };
    makeUpdateTeamStats = function() {
      return function(m, cb) {
        var result, teamid, _results;
        if (cb == null) cb = function() {};
        _results = [];
        for (teamid in results) {
          result = results[teamid];
          _results.push((function(teamid, result) {
            console.time("Team " + teamid + " update stats");
            return teamSvc.updateStatsSilent(teamid, result.opponentid, result.win, function(err) {
              console.timeEnd("Team " + teamid + " update stats");
              if (err != null) {
                console.log("Team " + teamid + " update stats with error " + err);
              }
              return cb.apply(this, arguments);
            });
          })(teamid, result));
        }
        return _results;
      };
    };
    makeUpdatePlayerStats = function() {
      var players, team, _fn2, _j, _len2, _ref4;
      players = [];
      _ref4 = am.teams;
      _fn2 = function(team) {
        return players = players.concat(team.members);
      };
      for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
        team = _ref4[_j];
        _fn2(team);
      }
      console.log('Player Ids = ', players);
      makeUpdatePlayerStats = function(teamidByplayerIdFn) {
        return function(playerid, cb2) {
          if (cb2 == null) cb2 = function() {};
          result = results[teamidByplayerIdFn(playerid)];
          console.log("Found result " + result + " for player " + playerid);
          console.time("Updating player " + playerid + " stats");
          return playerSvc.updateStatsSilent(playerid, result.opponentid, result.win, function() {
            console.timeEnd("Updating player " + playerid + " stats");
            return cb2.apply(this, arguments);
          });
        };
      };
      return function(m, cb) {
        var fn;
        if (cb == null) cb = function() {};
        fn = function(playerid) {
          var ids, team, _k, _len3, _ref5;
          _ref5 = am.teams;
          for (_k = 0, _len3 = _ref5.length; _k < _len3; _k++) {
            team = _ref5[_k];
            if (team.members.indexOf(playerid) >= 0) ids = team._id;
          }
          console.log("Found team " + ids + " for player " + playerid);
          return String(ids);
        };
        console.time('Updating players stats');
        return utils.mapAsync(players, makeUpdatePlayerStats(fn), function() {
          console.timeEnd('Updating players stats');
          return cb.apply(this, arguments);
        });
      };
    };
    makeSetTeamMatchComplete = function() {
      return function(m, cb) {
        var team, _fn2, _j, _len2, _ref4;
        if (cb == null) cb = function() {};
        _ref4 = am.teams;
        _fn2 = function(team) {
          console.time("Match " + am._id + " Set team " + team._id + " match complete");
          return teamSvc.setMatchComplete(team._id, am, function(err) {
            console.timeEnd("Match " + am._id + " Set team " + team._id + " match complete");
            if (err != null) {
              return console.log("Match " + am._id + " Set team " + team._id + " match complete with error " + err);
            }
          });
        };
        for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
          team = _ref4[_j];
          _fn2(team);
        }
        return cb(null);
      };
    };
    return utils.seriesAsync([makeSetMatchComplete(), makeUpdateTeamStats(), makeUpdatePlayerStats(), makeSetTeamMatchComplete()], am, function() {
      return console.log('Done!');
    });
  };

}).call(this);
