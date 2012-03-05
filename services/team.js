(function() {
  var addMatch, matchSvc, newTeamRepo, userSvc, utils,
    __slice = Array.prototype.slice;

  newTeamRepo = require('../repository/teams2');

  utils = require('./utils');

  userSvc = require('./user');

  matchSvc = require('./match');

  exports.addMatch = addMatch = function(teamid, am, callback) {
    if (callback == null) callback = function() {};
  };

  exports.acceptChallenge = function(inputs, callback) {
    var teamids,
      _this = this;
    if (callback == null) callback = function() {};
    console.assert(inputs != null, 'inputs cannot be null');
    if (inputs == null) throw 'Inputs cannot be null';
    teamids = [inputs.challengingteamid, inputs.challengedteamid];
    return utils.execute(utils.mapAsync, teamids, newTeamRepo.getById).then(function(err, teams, cb) {
      var am, end, start;
      _this.teams = teams;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      start = new Date();
      end = new Date();
      am = {
        start: start,
        end: new Date(end.setDate(end.getDate() + 3)),
        status: 'pending',
        teams: teams
      };
      return matchSvc.createMatch(am, cb);
    }).then(function(err, am, cb) {
      _this.am = am;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      return utils.mapAsync(_this.teams, function(team, cb) {
        return addMatch(team._id, this.am, cb);
      }, cb);
    }).then(function() {
      var args, cb, err, _i;
      err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      newTeamRepo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid);
      newTeamRepo.removeChallenge(inputs.challengingteamid, inputs.challengedteamid);
      return cb();
    }).then(function() {
      var args, cb, err, team, _fn, _i, _j, _len, _ref;
      err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      _ref = this.teams;
      _fn = function(team) {
        return utils.mapAsync(team.members, function(memberid, mapcb) {
          var post;
          if (mapcb == null) mapcb = function() {};
          post = {
            type: 'newmatch',
            data: {
              matchid: String(this.am._id)
            },
            createdat: new Date()
          };
          return userSvc.addPost(memberid, post, mapcb);
        }, cb);
      };
      for (_j = 0, _len = _ref.length; _j < _len; _j++) {
        team = _ref[_j];
        _fn(team);
      }
      return callback();
    });
  };

  exports.cancelChallenge = function(inputs, callback) {
    if (callback == null) callback = function() {};
    console.assert(inputs != null, 'inputs cannot be null');
    if (inputs == null) throw 'Inputs cannot be null';
    return utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid).then(function() {
      var cb, err, others, _i;
      err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      return newTeamRepo.getById(inputs.challengingteamid, cb);
    }).then(function(err, team, cb) {
      var member, _fn, _i, _len, _ref;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      if (Array.isArray(team != null ? team.members : void 0)) {
        _ref = team.members;
        _fn = function(member) {
          var post;
          post = {
            type: 'challengecancelling',
            data: {
              teamid: inputs.challengedteamid,
              msg: 'Chicken dance'
            },
            createdat: new Date()
          };
          return userSvc.addPost(member._id, post);
        };
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _fn(member);
        }
      }
      return cb();
    }).then(function() {
      var args, cb, err, _i;
      err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      return newTeamRepo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid, cb);
    }).then(function() {
      var cb, err, others, _i;
      err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      return newTeamRepo.getById(inputs.challengedteamid, cb);
    }).then(function(err, team, cb) {
      var member, _fn, _i, _len, _ref;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      if (Array.isArray(team != null ? team.members : void 0)) {
        _ref = team.members;
        _fn = function(member) {
          var post;
          post = {
            type: 'challengecancelled',
            data: {
              teamid: inputs.challengingteamid,
              msg: 'Chicken dance'
            },
            createdat: new Date()
          };
          return userSvc.addPost(member._id, post);
        };
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _fn(member);
        }
      }
      return cb();
    });
  };

  exports.declineChallenge = function(inputs, callback) {
    if (callback == null) callback = function() {};
    console.assert(inputs != null, 'inputs cannot be null');
    if (inputs == null) throw 'Inputs cannot be null';
    return utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid).then(function() {
      var cb, err, others, _i;
      err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      return newTeamRepo.getById(inputs.challengingteamid, cb);
    }).then(function(err, team, cb) {
      var member, _fn, _i, _len, _ref;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      if (Array.isArray(team != null ? team.members : void 0)) {
        _ref = team.members;
        _fn = function(member) {
          var post;
          post = {
            type: 'challengedeclined',
            data: {
              teamid: inputs.challengedteamid,
              msg: 'Chicken dance'
            },
            createdat: new Date()
          };
          return userSvc.addPost(member._id, post);
        };
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _fn(member);
        }
      }
      return cb();
    }).then(function() {
      var args, cb, err, _i;
      err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      return newTeamRepo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid, cb);
    }).then(function() {
      var cb, err, others, _i;
      err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      return newTeamRepo.getById(inputs.challengedteamid, cb);
    }).then(function(err, team, cb) {
      var member, _fn, _i, _len, _ref;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      if (Array.isArray(team != null ? team.members : void 0)) {
        _ref = team.members;
        _fn = function(member) {
          var post;
          post = {
            type: 'challengedeclining',
            data: {
              teamid: inputs.challengingteamid,
              msg: 'Chicken dance'
            },
            createdat: new Date()
          };
          return userSvc.addPost(member._id, post);
        };
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          member = _ref[_i];
          _fn(member);
        }
      }
      return cb();
    });
  };

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

  exports.resetStats = function(teamid, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(teamid != null, 'teamid cannot be null or 0');
    if (teamid == null) throw 'teamid is null or empty';
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    findObj = {
      _id: teamid
    };
    updateObj = {
      $unset: {
        stats: 1
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

  exports.updateStatsSilent = function(teamid, opponentid, win, callback) {
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
      $inc: incObj
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

  exports.getAll = function(availableOnly, callback) {
    var query;
    if (callback == null) callback = function() {};
    query = {};
    if (availableOnly) {
      query = {
        '$or': [
          {
            members: null
          }, {
            members: {
              $size: 0
            }
          }, {
            members: {
              $size: 1
            }
          }
        ]
      };
    }
    try {
      return newTeamRepo.read(query, function(readErr, cursor) {
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

  exports.getById = function(teamid, callback) {
    if (callback == null) callback = function() {};
    console.assert(teamid, 'TeamId cannot be null or 0');
    if (!teamid) throw 'TeamId cannot be null or 0';
    return newTeamRepo.getById(teamid, callback);
  };

}).call(this);
