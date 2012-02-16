(function() {
  var teamRepo;

  teamRepo = require('../repository/teams');

  exports.cancelMatch = function(teamid, match, callback) {
    if (callback == null) callback = function() {};
    if (!((teamid != null) && teamid !== 'undefined' && (match != null) && match !== 'undefined')) {
      return callback();
    }
    return teamRepo.cancelMatch(teamid, match, callback);
  };

  exports.updateStats = function(teamid, opponentid, win, callback) {
    if (callback == null) callback = function() {};
    if (typeof teamid !== 'string') teamid = String(teamid);
    if (typeof opponentid !== 'string') opponentid = String(opponentid);
    return teamRepo.updateStats(teamid, opponentid, win, callback);
  };

  exports.setMatchComplete = function(teamid, matchid, callback) {
    if (callback == null) callback = function() {};
    if (typeof teamid !== 'string') teamid = String(teamid);
    if (typeof matchid !== 'string') matchid = String(matchid);
    return teamRepo.completeMatch(teamid, matchid, callback);
  };

}).call(this);
