(function() {
  var addMatch, getChallenge, matchSvc, newTeamRepo, userSvc, utils,
    __slice = Array.prototype.slice;

  newTeamRepo = require('../repository/teams2');

  utils = require('./utils');

  userSvc = require('./user');

  matchSvc = require('./match');

  /*
  */

  exports.createJoinRequest = function(teamid, playerid, callback) {
    var findObj, joinRequest, post, updateObj;
    if (callback == null) callback = function() {};
    console.assert(teamid != null, 'teamid cannot be null');
    if (teamid == null) throw 'teamid cannot be null';
    console.assert(playerid != null, 'playerid cannot be null');
    if (playerid == null) throw 'playerid cannot be null';
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    findObj = {
      _id: teamid
    };
    post = {
      type: 'joinrequest',
      data: {
        userid: playerid
      },
      createdat: new Date()
    };
    joinRequest = {
      requestor: playerid
    };
    updateObj = {
      $addToSet: {
        joinrequests: joinRequest,
        posts: post
      },
      $set: {
        updatedat: new Date()
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

  /*
  Add a match into a team
  */

  exports.addMatch = addMatch = function(teamid, am, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(teamid != null, 'teamid cannot be null');
    if (teamid == null) throw 'teamid cannot be null';
    console.assert(am != null, 'am cannot be null');
    if (am == null) throw 'am cannot be null';
    am.status = 'pending';
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    findObj = {
      _id: teamid
    };
    updateObj = {
      $addToSet: {
        matches: am
      },
      $set: {
        updatedat: new Date()
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

  /*
  Retrieve an existing challenge
  */

  exports.getChallenge = getChallenge = function(teamid, opponentid, callback) {
    if (callback == null) callback = function() {};
    console.assert(teamid != null, 'teamid cannot be null');
    if (teamid == null) throw 'teamid cannot be null';
    console.assert(opponentid != null, 'opponentid cannot be null');
    if (opponentid == null) throw 'opponentid cannot be null';
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    if (typeof opponentid === 'string') {
      opponentid = new newTeamRepo.ObjectId(opponentid);
    }
    try {
      return newTeamRepo.read({
        _id: teamid,
        challenges: {
          '$elemMatch': {
            teamid: opponentid
          }
        }
      }, {}, function(err, cursor) {
        if (err) return callback(err);
        return cursor.toArray(callback);
      });
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

  /*
  Add a challenge obj in both teams, as well as the log for teams and players
  */

  exports.createTeamChallenge = function(params, callback) {
    var matchtype, msg, opponentid, teamid,
      _this = this;
    if (callback == null) callback = function() {};
    console.assert(params != null, 'params cannot be null');
    if (params == null) throw 'params cannot be null';
    utils = require('./utils');
    userSvc = require('./user');
    teamid = params.teamid, msg = params.msg, matchtype = params.matchtype;
    if (typeof teamid === 'string') teamid = new newTeamRepo.ObjectId(teamid);
    opponentid = null;
    try {
      return utils.execute(userSvc.getById, params.opponentplayerid).then(function(err, opponentplayer, cb) {
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        params.opponentid = opponentid = opponentplayer.team._id;
        try {
          return getChallenge(teamid, opponentid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, challenges, cb) {
        if (cb == null) cb = function() {};
        if (challenges != null ? challenges.length : void 0) {
          return callback('Already challenged');
        } else {
          return cb();
        }
      }).then(function() {
        var args, cb, challenge, challengePost, findObj, updateObj, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        challenge = {
          type: 'challenged',
          message: params.msg,
          matchtype: params.matchtype,
          teamid: opponentid
        };
        findObj = {
          _id: teamid
        };
        challengePost = {
          type: 'challenged',
          data: challenge,
          createdat: new Date()
        };
        updateObj = {
          $addToSet: {
            challenges: challenge,
            posts: challengePost
          },
          $set: {
            updatedat: new Date()
          }
        };
        try {
          return newTeamRepo.update(findObj, updateObj, {}, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function() {
        var args, cb, err, _i;
        err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        try {
          return newTeamRepo.getById(teamid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, challengedTeam, cb) {
        var memberid, _fn, _i, _len, _ref;
        if (cb == null) cb = function() {};
        _ref = challengedTeam != null ? challengedTeam.members : void 0;
        _fn = function(memberid) {
          var post;
          post = {
            type: 'teamchallenged',
            data: {
              teamid: opponentid,
              msg: msg,
              matchtype: matchtype
            },
            createdat: new Date()
          };
          try {
            return userSvc.addPost(memberid, post);
          } catch (e) {
            return console.trace(e);
          }
        };
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          memberid = _ref[_i];
          _fn(memberid);
        }
        return cb();
      }).then(function() {
        var args, cb, challenge, challengePost, findObj, updateObj, _i;
        args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        challenge = {
          type: 'challenging',
          message: msg,
          matchtype: matchtype,
          teamid: teamid
        };
        findObj = {
          _id: opponentid
        };
        challengePost = {
          type: 'challenging',
          data: challenge,
          createdat: new Date()
        };
        updateObj = {
          $addToSet: {
            challenges: challenge,
            posts: challengePost
          },
          $set: {
            updatedat: new Date()
          }
        };
        try {
          return newTeamRepo.update(findObj, updateObj, {}, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function() {
        var args, cb, err, _i;
        err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        try {
          return newTeamRepo.getById(opponentid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, challengingTeam, cb) {
        var memberid, _fn, _i, _len, _ref;
        if (cb == null) cb = function() {};
        _ref = challengingTeam != null ? challengingTeam.members : void 0;
        _fn = function(memberid) {
          var post;
          post = {
            type: 'teamchallenging',
            data: {
              teamid: teamid,
              msg: msg,
              matchtype: matchtype
            },
            createdat: new Date()
          };
          try {
            return userSvc.addPost(memberid, post);
          } catch (e) {
            return console.trace(e);
          }
        };
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          memberid = _ref[_i];
          _fn(memberid);
        }
        return cb();
      }).then(function() {
        return callback();
      });
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

  /*
  Create a pending match, add it to both teams, remove the challenge
  */

  exports.acceptChallenge = function(inputs, callback) {
    var teamids,
      _this = this;
    if (callback == null) callback = function() {};
    console.assert(inputs != null, 'inputs cannot be null');
    if (inputs == null) throw 'Inputs cannot be null';
    teamids = [inputs.challengingteamid, inputs.challengedteamid];
    try {
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
        try {
          return matchSvc.createMatch(am, cb);
        } catch (e) {
          console.trace(e);
          throw e;
        }
      }).then(function(err, ams, cb) {
        if (cb == null) cb = function() {};
        _this.am = ams != null ? ams[0] : void 0;
        if (err) return callback(err);
        try {
          return utils.mapAsync(_this.teams, function(team, cb) {
            return addMatch(team._id, _this.am, cb);
          }, cb);
        } catch (e) {
          console.trace(e);
          throw e;
        }
      }).then(function() {
        var args, cb, err, _i;
        err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        try {
          newTeamRepo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid);
          newTeamRepo.removeChallenge(inputs.challengingteamid, inputs.challengedteamid);
        } catch (e) {
          console.trace(e);
          throw e;
        }
        return cb();
      }).then(function() {
        var args, cb, err, team, _fn, _i, _j, _len, _ref;
        err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        _ref = _this.teams;
        _fn = function(team) {
          try {
            return utils.mapAsync(team.members, function(memberid, mapcb) {
              var post;
              if (mapcb == null) mapcb = function() {};
              post = {
                type: 'newmatch',
                data: {
                  matchid: String(_this.am._id)
                },
                createdat: new Date()
              };
              try {
                return userSvc.addPost(memberid, post, mapcb);
              } catch (e) {
                console.trace(e);
                throw e;
              }
            }, cb);
          } catch (e) {
            console.trace(e);
            throw e;
          }
        };
        for (_j = 0, _len = _ref.length; _j < _len; _j++) {
          team = _ref[_j];
          _fn(team);
        }
        return callback();
      });
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

  exports.cancelChallenge = function(inputs, callback) {
    if (callback == null) callback = function() {};
    console.assert(inputs != null, 'inputs cannot be null');
    if (inputs == null) throw 'Inputs cannot be null';
    try {
      return utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid).then(function() {
        var cb, err, others, _i;
        err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        try {
          return newTeamRepo.getById(inputs.challengingteamid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, team, cb) {
        var memberid, _fn, _i, _len, _ref;
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        if (Array.isArray(team != null ? team.members : void 0)) {
          _ref = team.members;
          _fn = function(memberid) {
            var post;
            post = {
              type: 'challengecancelling',
              data: {
                teamid: inputs.challengedteamid,
                msg: 'Chicken dance'
              },
              createdat: new Date()
            };
            try {
              return userSvc.addPost(memberid, post);
            } catch (e) {
              return console.trace(e);
            }
          };
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            memberid = _ref[_i];
            _fn(memberid);
          }
        }
        return cb();
      }).then(function() {
        var args, cb, err, _i;
        err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        try {
          return newTeamRepo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function() {
        var cb, err, others, _i;
        err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        console.log('Step 5', err);
        if (err) return callback(err);
        try {
          return newTeamRepo.getById(inputs.challengedteamid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, team, cb) {
        var memberid, _fn, _i, _len, _ref;
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        if (Array.isArray(team != null ? team.members : void 0)) {
          _ref = team.members;
          _fn = function(memberid) {
            var post;
            post = {
              type: 'challengecancelled',
              data: {
                teamid: inputs.challengingteamid,
                msg: 'Chicken dance'
              },
              createdat: new Date()
            };
            try {
              return userSvc.addPost(memberid, post);
            } catch (e) {
              return console.trace(e);
            }
          };
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            memberid = _ref[_i];
            _fn(memberid);
          }
        }
        return callback();
      });
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

  exports.declineChallenge = function(inputs, callback) {
    if (callback == null) callback = function() {};
    console.assert(inputs != null, 'inputs cannot be null');
    if (inputs == null) throw 'Inputs cannot be null';
    try {
      return utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid).then(function() {
        var cb, err, others, _i;
        err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        try {
          return newTeamRepo.getById(inputs.challengingteamid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, team, cb) {
        var memberid, _fn, _i, _len, _ref;
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        if (Array.isArray(team != null ? team.members : void 0)) {
          _ref = team.members;
          _fn = function(memberid) {
            var post;
            post = {
              type: 'challengedeclined',
              data: {
                teamid: inputs.challengedteamid,
                msg: 'Chicken dance'
              },
              createdat: new Date()
            };
            try {
              return userSvc.addPost(memberid, post);
            } catch (e) {
              return console.trace(e);
            }
          };
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            memberid = _ref[_i];
            _fn(memberid);
          }
        }
        return cb();
      }).then(function() {
        var args, cb, err, _i;
        err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        try {
          return newTeamRepo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function() {
        var cb, err, others, _i;
        err = arguments[0], others = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        try {
          return newTeamRepo.getById(inputs.challengedteamid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, team, cb) {
        var memberid, _fn, _i, _len, _ref;
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        if (Array.isArray(team != null ? team.members : void 0)) {
          _ref = team.members;
          _fn = function(memberid) {
            var post;
            post = {
              type: 'challengedeclining',
              data: {
                teamid: inputs.challengingteamid,
                msg: 'Chicken dance'
              },
              createdat: new Date()
            };
            try {
              return userSvc.addPost(memberid, post);
            } catch (e) {
              return console.trace(e);
            }
          };
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            memberid = _ref[_i];
            _fn(memberid);
          }
        }
        return callback();
      });
    } catch (e) {
      console.trace(e);
      throw e;
    }
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
      return newTeamRepo.update(findObj, updateObj, {}, callback);
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
        stats: 1,
        records: 1
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      throw e;
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
        posts: statLog,
        records: statLog
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      throw e;
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
      $inc: incObj,
      $addToSet: {
        records: statLog
      }
    };
    try {
      return newTeamRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      throw e;
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
      return newTeamRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      throw e;
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
    query = {
      hidden: {
        $ne: 1
      }
    };
    if (availableOnly) {
      query.$or = [
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
      ];
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
      console.trace(e);
      throw e;
    }
  };

  exports.getById = function(teamid, callback) {
    if (callback == null) callback = function() {};
    console.assert(teamid, 'TeamId cannot be null or 0');
    if (!teamid) throw 'TeamId cannot be null or 0';
    return newTeamRepo.getById(teamid, callback);
  };

  exports.create = function() {
    var args, callback, team, _i;
    team = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), callback = arguments[_i++];
    if (callback == null) callback = function() {};
    if (typeof team === 'string') {
      team = {
        teamname: team
      };
    }
    try {
      return newTeamRepo.create(team, callback);
    } catch (e) {
      console.trace(e);
      throw e;
    }
  };

}).call(this);
