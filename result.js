(function() {
  var matchSvc, processMatch, removeMatch, teamSvc, updateMatchScore, userSvc, utils;

  userSvc = require('./services/user');

  teamSvc = require('./services/team');

  matchSvc = require('./services/match');

  utils = require('./services/utils');

  updateMatchScore = function(m, callback) {
    if (callback == null) callback = function() {};
    return matchSvc.finalize(m, callback);
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
      console.log('update match score in here');
      return updateMatchScore(m);
    } else {
      return removeMatch(m);
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
