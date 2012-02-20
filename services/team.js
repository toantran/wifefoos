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

  exports.sortingTeams = function(team1, team2) {
    var avg1, avg2, loss1, loss2, total1, total2, win1, win2, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    win1 = (_ref = team1 != null ? (_ref2 = team1.stats) != null ? _ref2.win : void 0 : void 0) != null ? _ref : 0;
    loss1 = (_ref3 = team1 != null ? (_ref4 = team1.stats) != null ? _ref4.loss : void 0 : void 0) != null ? _ref3 : 0;
    total1 = win1 + loss1;
    avg1 = total1 ? win1 / total1 : 0;
    win2 = (_ref5 = team2 != null ? (_ref6 = team2.stats) != null ? _ref6.win : void 0 : void 0) != null ? _ref5 : 0;
    loss2 = (_ref7 = team2 != null ? (_ref8 = team2.stats) != null ? _ref8.loss : void 0 : void 0) != null ? _ref7 : 0;
    total2 = win2 + loss2;
    avg2 = total2 ? win2 / total2 : 0;
    if (avg1 !== avg2) {
      return -avg1 + avg2;
    } else if (win1 !== win2) {
      return -win1 + win2;
    } else {
      return loss1 - loss2;
    }
  };

}).call(this);
