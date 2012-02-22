(function() {
  var newTeamRepo, teamRepo;

  teamRepo = require('../repository/teams');

  newTeamRepo = require('../repository/teams2');

  exports.cancelMatch = function(teamid, matchid, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    if (!((teamid != null) && teamid !== 'undefined' && (matchid != null) && matchid !== 'undefined')) {
      return callback();
    }
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    if (typeof matchid === 'string') matchid = new newTeamRepo.ObjectId(matchid);
    findObj = {
      _id: teamid
    };
    updateObj = {
      $pull: {
        matches: {
          _id: matchid
        }
      },
      $set: {
        updatedat: new Date()
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  exports.updateStats = function(teamid, opponentid, win, callback) {
    var findObj, incObj, statLog, updateObj;
    if (callback == null) callback = function() {};
    console.assert(teamid != null, 'teamid cannot be null or 0');
    if (teamid == null) throw 'teamid is null or empty';
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    if (typeof opponentid !== 'string') opponentid = String(opponentid);
    findObj = {
      _id: teamid
    };
    incObj = win ? {
      'stats.win': 1
    } : {
      'stats.loss': 1
    };
    statLog = {
      id: new newTeamRepo.ObjectId(),
      type: 'matchresult',
      data: {
        opponentid: opponentid,
        result: win ? 'win' : 'lose'
      },
      createdat: new Date()
    };
    updateObj = {
      $inc: incObj,
      $set: {
        updatedat: new Date()
      },
      $addToSet: {
        posts: statLog
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  exports.setMatchComplete = function(teamid, am, callback) {
    var findObj, matchid, updateObj;
    if (callback == null) callback = function() {};
    if (!((teamid != null) && teamid !== 'undefined' && (am != null) && am !== 'undefined')) {
      return callback();
    }
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    matchid = am._id;
    findObj = {
      _id: teamid
    };
    updateObj = {
      $addToSet: {
        completematches: am
      },
      $pull: {
        matches: {
          _id: matchid
        }
      },
      $set: {
        updatedat: new Date()
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
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
