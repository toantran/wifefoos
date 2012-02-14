(function() {
  var matchSvc, processMatch, teamSvc, userSvc;

  userSvc = require('./services/user');

  teamSvc = require('./services/team');

  matchSvc = require('./services/match');

  processMatch = function(m) {
    var _ref;
    if (m == null) return;
    return console.log(m.status, m.start, (_ref = m.votes) != null ? _ref.length : void 0);
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
