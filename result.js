(function() {
  var matchSvc, processMatch, teamSvc, updateMatchScore, userSvc;

  userSvc = require('./services/user');

  teamSvc = require('./services/team');

  matchSvc = require('./services/match');

  updateMatchScore = function(m) {
    var count, result, results, setMatchComplete, team, teamid, _i, _j, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _results;
    console.log('Counting votes');
    if ((m != null ? (_ref = m.teams) != null ? _ref.length : void 0 : void 0) !== 2) {
      return;
    }
    results = {};
    results[String(m.teams[0]._id)] = {
      count: 0,
      opponentid: String(m.teams[1]._id)
    };
    results[String(m.teams[1]._id)] = {
      count: 0,
      opponentid: String(m.teams[0]._id)
    };
    _ref2 = m.votes;
    for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
      _ref3 = _ref2[_i], teamid = _ref3.teamid, count = _ref3.count;
      results[teamid].count += count;
    }
    console.log('Result ');
    for (result = 0, _len2 = results.length; result < _len2; result++) {
      teamid = results[result];
      console.log('team %s count=%n', teamid, result.count);
    }
    console.time('Set match status to complete');
    matchSvc.setStatus(String(m._id), 'complete', function(err) {
      console.timeEnd('Set match status to complete');
      return console.log('Set match status to complete with err %s', err);
    });
    for (result = 0, _len3 = results.length; result < _len3; result++) {
      teamid = results[result];
      console.time("Team " + teamid + " update stats");
      teamSvc.updateStats(teamid, result.opponentid, result.count > 0, function(err) {
        console.timeEnd("Team " + teamid + " update stats");
        if (err) {
          return console.log("Team " + teamid + " update stats with error " + err);
        }
      });
      console.time("Players of team " + teamid + " update stats");
      userSvc.updateStats(teamid, result.opponentid, result.count > 0, function(err) {
        console.timeEnd("Players of team " + teamid + " update stats");
        if (err) {
          return console.log("Players of team " + teamid + " update stats with error " + err);
        }
      });
    }
    setMatchComplete = function(teamid, matchid) {
      console.time("Set team " + teamid + " match complete");
      return teamSvc.setMatchComplete(teamid, matchid, function(err) {
        console.timeEnd("Set team " + teamid + " match complete");
        if (err) {
          return console.log("Set team " + teamid + " match complete with error " + err);
        }
      });
    };
    _ref4 = m.teams;
    _results = [];
    for (_j = 0, _len4 = _ref4.length; _j < _len4; _j++) {
      team = _ref4[_j];
      _results.push(setMatchComplete(team._id, m._id));
    }
    return _results;
  };

  processMatch = function(m) {
    var rm_cb, team, _i, _len, _ref, _ref2;
    if (m == null) return;
    console.log(m.status, m.start, (_ref = m.votes) != null ? _ref.length : void 0);
    if ((!(m.votes != null)) || (!m.votes.length)) {
      console.time('Cancelling match for team');
      rm_cb = function(err) {
        console.timeEnd('Cancelling match for team');
        if (err) {
          return console.log('Cancelling match for team with error %s', err);
        }
      };
      _ref2 = m.teams;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        team = _ref2[_i];
        teamSvc.cancelMatch(String(team._id), String(m._id), rm_cb);
      }
      console.time('Cancelling match');
      return matchSvc.setStatus(m._id, 'Cancelled', function(err) {
        console.timeEnd('Cancelling match');
        if (err) return console.log('Cancelling match err %s', err);
      });
    } else {
      return updateMatchScore(m);
    }
  };

  try {
    console.time('Getting pending matches');
    matchSvc.getPendingExpiredMatches(function(error, matches) {
      var m, _i, _len, _results;
      console.timeEnd('Getting pending matches');
      if (error) console.log('Error %s', error);
      if (matches != null) {
        _results = [];
        for (_i = 0, _len = matches.length; _i < _len; _i++) {
          m = matches[_i];
          _results.push(processMatch(m));
        }
        return _results;
      }
    });
  } catch (e) {
    console.log(e);
  }

}).call(this);
