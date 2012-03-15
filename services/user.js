(function() {
  var crypto, hash, loadChallenge, loadChallenges, loadFullInvite, loadMatch, loadMatches, loadUserTeam, newUserRepo, teamRepo, utils;

  crypto = require('crypto');

  newUserRepo = require('../repository/users2');

  teamRepo = require('../repository/teams2');

  utils = require('./utils');

  hash = function(msg, key) {
    return crypto.createHmac('sha256', key).update(msg).digest('hex');
  };

  loadChallenge = function(challenge, callback) {
    if (challenge == null) return callback();
    if (challenge.teamid != null) {
      return teamRepo.getSimpleTeam(String(challenge.teamid), function(err, team) {
        var _ref;
        challenge.teamname = (_ref = team != null ? team.teamname : void 0) != null ? _ref : 'Unknown';
        return callback(null, challenge);
      });
    } else {
      return callback(null, challenge);
    }
  };

  loadChallenges = function(challenges, callback) {
    if (!((challenges != null) && challenges.length !== 0)) {
      return callback(null, challenges);
    }
    return utils.map(challenges, loadChallenge, callback);
  };

  loadMatch = function(hometeamid, m, callback) {
    var team, _i, _len, _ref, _ref2;
    if ((m != null ? (_ref = m.teams) != null ? _ref.length : void 0 : void 0) !== 0) {
      _ref2 = m.teams;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        team = _ref2[_i];
        if (team != null ? team._id.equals(hometeamid) : void 0) {
          m.opponentteamid = team._id;
          m.opponentteamname = team.teamname;
        }
      }
    }
    return callback(null, m);
  };

  loadMatches = function(hometeamid, matches, callback) {
    if (!((matches != null) && matches.length !== 0)) {
      return callback(null, matches);
    }
    return utils.map(matches, function(m, cb) {
      return loadMatch(hometeamid, m, cb);
    }, callback);
  };

  /*
  Load user's team with active matches and active challenges
  */

  loadUserTeam = function(teamid, callback) {
    if (!((teamid != null) && teamid !== 'undefined')) return callback();
    return teamRepo.getFullTeam(String(teamid), function(err, team) {
      var __loadChallengesFn, __loadMatchesFn;
      if ((err != null) || !(team != null)) return callback(err);
      __loadChallengesFn = function(lc_cb) {
        return loadChallenges(team.challenges, function(lc_err, challenges) {
          if (lc_err == null) team.challenges = challenges;
          return lc_cb(err, challenges);
        });
      };
      __loadMatchesFn = function(lm_cb) {
        return loadMatches(team._id, team.matches, function(lm_err, matches) {
          if (lm_err == null) {
            team.matches = matches.filter(function(am) {
              return am.end >= new Date();
            });
          }
          return lm_cb(err, matches);
        });
      };
      return utils.parallel([__loadChallengesFn, __loadMatchesFn], function(parallel_err, results) {
        return callback(err, team);
      });
    });
  };

  /*
  Authenticate a user login
  */

  exports.authenticate = function(username, password, callback) {
    var encryptedPassword;
    console.assert(username, 'username cannot be null or empty');
    if (username == null) throw 'username is null or empty';
    encryptedPassword = hash(password, 'a little dog');
    return newUserRepo.getByUsername(username, function(error, user) {
      if (error) {
        return callback(error);
      } else if (!(user != null)) {
        return callback('User not found');
      } else if (encryptedPassword === user.password) {
        return callback(null, true, user);
      } else {
        return callback(null, false);
      }
    });
  };

  /*
  LOAD a user document with all neccessary properties re-populated in the root object
  */

  exports.loadMobileUser = function(userid, callback) {
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    try {
      return newUserRepo.getById(userid, function(error, user) {
        var _ref, _ref2, _ref3, _ref4, _ref5;
        if (error) {
          return callback(error);
        } else if (user) {
          user.wins = (_ref = (_ref2 = user.stats) != null ? _ref2.win : void 0) != null ? _ref : 0;
          user.losses = (_ref3 = (_ref4 = user.stats) != null ? _ref4.loss : void 0) != null ? _ref3 : 0;
          try {
            return loadUserTeam((_ref5 = user.team) != null ? _ref5._id : void 0, function(err, team) {
              var _ref6, _ref7;
              user.challenges = team != null ? team.challenges : void 0;
              user.challengeCount = (team != null ? (_ref6 = team.challenges) != null ? _ref6.length : void 0 : void 0) || 0;
              user.matches = team != null ? team.matches : void 0;
              console.dir(user.matches);
              user.matchCount = (team != null ? (_ref7 = team.matches) != null ? _ref7.length : void 0 : void 0) || 0;
              return callback(null, user);
            });
          } catch (loadUserTeamEx) {
            console.trace(loadUserTeamEx);
            return callback(loadUserTeamEx);
          }
        } else {
          return callback(null, user);
        }
      });
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  LOAD a user document by Id
  */

  exports.getById = function(userid, callback) {
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    try {
      return newUserRepo.getById(userid, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Update player's stats
  */

  exports.resetStats = function(userid, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    findObj = {
      _id: userid
    };
    updateObj = {
      $unset: {
        stats: 1,
        records: 1
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Update player's stats
  */

  exports.updateStats = function(userid, opponentid, win, callback) {
    var findObj, incObj, statLog, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    if (typeof opponentid !== 'string') opponentid = String(opponentid);
    findObj = {
      _id: userid
    };
    incObj = win ? {
      'stats.win': 1
    } : {
      'stats.loss': 1
    };
    statLog = {
      id: new newUserRepo.ObjectId(),
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
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Update player's stats.  Silently
  */

  exports.updateStatsSilent = function(userid, opponentid, win, callback) {
    var findObj, incObj, statLog, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    if (typeof opponentid !== 'string') opponentid = String(opponentid);
    findObj = {
      _id: userid
    };
    incObj = win ? {
      'stats.win': 1
    } : {
      'stats.loss': 1
    };
    statLog = {
      id: new newUserRepo.ObjectId(),
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
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Update player's picture
  */

  exports.updatePicture = function(userid, pictureurl, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    findObj = {
      _id: userid
    };
    updateObj = {
      $set: {
        pictureurl: pictureurl,
        updatedat: new Date()
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Add a vote record into player's record
  */

  exports.addVote = function(userid, vote, callback) {
    var findObj, logObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    findObj = {
      _id: userid
    };
    logObj = {
      type: 'matchresult',
      data: {
        matchid: vote.matchid,
        teamid: vote.teamid
      },
      createdat: new Date()
    };
    updateObj = {
      $set: {
        updatedat: new Date()
      },
      $addToSet: {
        votes: vote,
        logs: logObj
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Set a team to a player
  */

  exports.setTeam = function(userid, team, callback) {
    var findObj, post, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    findObj = {
      _id: userid
    };
    post = {
      id: new newUserRepo.ObjectId(),
      type: 'jointeam',
      data: {
        teamid: String(team._id)
      },
      createdat: new Date()
    };
    updateObj = {
      $set: {
        team: team,
        updatedat: new Date()
      },
      $unset: {
        invites: 1
      },
      $addToSet: {
        posts: post
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Add a post record into player's record
  */

  exports.addPost = function(userid, post, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    findObj = {
      _id: userid
    };
    post || (post = {});
    post.createdat = new Date();
    post.id = new newUserRepo.ObjectId();
    updateObj = {
      $set: {
        updatedat: new Date()
      },
      $addToSet: {
        posts: post
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Remove a post from player's record
  */

  exports.removePost = function(userid, postid, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    console.assert(postid, 'postid cannot be null or 0');
    if (postid == null) throw 'postid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    if (typeof postid === 'string') postid = new newUserRepo.ObjectId(postid);
    findObj = {
      _id: userid
    };
    updateObj = {
      $set: {
        updatedat: new Date()
      },
      $pull: {
        posts: {
          id: postid
        }
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Add a comment record into player's record
  */

  exports.addComment = function(userid, postid, data, callback) {
    var findObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    console.assert(postid, 'postid cannot be null or 0');
    if (postid == null) throw 'postid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    if (typeof postid === 'string') postid = new newUserRepo.ObjectId(postid);
    data || (data = {});
    data.id = new newUserRepo.ObjectId();
    data.createdat = new Date();
    findObj = {
      _id: userid
    };
    try {
      return newUserRepo.getById(userid, function(getErr, user) {
        var post, _i, _len, _ref, _ref2, _results;
        if (getErr != null) return callback(getErr);
        _ref = user != null ? user.posts : void 0;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          post = _ref[_i];
          if (post != null ? (_ref2 = post.id) != null ? _ref2.equals(postid) : void 0 : void 0) {
            _results.push((function(post) {
              var updateObj;
              post.comments || (post.comments = []);
              post.comments.push(data);
              updateObj = {
                $set: {
                  posts: user != null ? user.posts : void 0,
                  updatedat: new Date()
                }
              };
              return newUserRepo.update(findObj, updateObj, {}, callback);
            })(post));
          }
        }
        return _results;
      });
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Remove a comment
  */

  exports.removeComment = function(userid, postid, commentid, callback) {
    var findObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    console.assert(postid, 'postid cannot be null or 0');
    if (postid == null) throw 'postid is null or empty';
    console.assert(commentid, 'commentid cannot be null or 0');
    if (commentid == null) throw 'commentid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    if (typeof postid === 'string') postid = new newUserRepo.ObjectId(postid);
    if (typeof commentid === 'string') {
      commentid = new newUserRepo.ObjectId(commentid);
    }
    findObj = {
      _id: userid
    };
    try {
      return newUserRepo.getById(userid, function(getErr, user) {
        var post, _i, _len, _ref, _ref2, _results;
        if (getErr != null) return callback(getErr);
        _ref = user != null ? user.posts : void 0;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          post = _ref[_i];
          if (post != null ? (_ref2 = post.id) != null ? _ref2.equals(postid) : void 0 : void 0) {
            _results.push((function(post) {
              var comment, index, updateObj, _fn, _len2, _ref3;
              _ref3 = post != null ? post.comments : void 0;
              _fn = function(comment, index) {
                var _ref4;
                if (comment != null ? (_ref4 = comment.id) != null ? _ref4.equals(commentid) : void 0 : void 0) {
                  return post != null ? post.comments.splice(index, 1) : void 0;
                }
              };
              for (index = 0, _len2 = _ref3.length; index < _len2; index++) {
                comment = _ref3[index];
                _fn(comment, index);
              }
              updateObj = {
                $set: {
                  posts: user != null ? user.posts : void 0,
                  updatedat: new Date()
                }
              };
              return newUserRepo.update(findObj, updateObj, {}, callback);
            })(post));
          }
        }
        return _results;
      });
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  Add a vote record into player's record
  */

  exports.addTeamInvite = function(userid, teamid, callback) {
    var findObj, invite, invitedPost, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (userid == null) throw 'userid is null or empty';
    console.assert(teamid, 'teamid cannot be null or 0');
    if (teamid == null) throw 'teamid is null or empty';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    if (typeof teamid === 'string') teamid = new newUserRepo.ObjectId(teamid);
    findObj = {
      _id: userid
    };
    invite = {
      teamid: teamid
    };
    invitedPost = {
      id: new newUserRepo.ObjectId(),
      type: 'invite',
      data: {
        teamid: teamid
      },
      createdat: new Date()
    };
    updateObj = {
      $set: {
        updatedat: new Date()
      },
      $addToSet: {
        invites: invite,
        posts: invitedPost
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  exports.sortingPlayers = function(player1, player2) {
    var avg1, avg2, loss1, loss2, total1, total2, win1, win2, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8;
    win1 = (_ref = player1 != null ? (_ref2 = player1.stats) != null ? _ref2.win : void 0 : void 0) != null ? _ref : 0;
    loss1 = (_ref3 = player1 != null ? (_ref4 = player1.stats) != null ? _ref4.loss : void 0 : void 0) != null ? _ref3 : 0;
    total1 = win1 + loss1;
    avg1 = total1 ? win1 / total1 : 0;
    win2 = (_ref5 = player2 != null ? (_ref6 = player2.stats) != null ? _ref6.win : void 0 : void 0) != null ? _ref5 : 0;
    loss2 = (_ref7 = player2 != null ? (_ref8 = player2.stats) != null ? _ref8.loss : void 0 : void 0) != null ? _ref7 : 0;
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

  exports.insert = function(user, callback) {
    if (callback == null) callback = function() {};
    console.assert(user, 'user cannot be null');
    if (user == null) throw 'user cannot be null';
    return utils.execute(newUserRepo.getByUsername, user.username).then(function(err, existingUser, cb) {
      if (err != null) {
        return callback(err);
      } else if (existingUser != null) {
        return callback('You Chose an Email Address That is Already Registered, You Hacker!');
      } else {
        user.createdat = new Date();
        if (user.pictureurl == null) user.pictureurl = '/images/player.jpg';
        if (user.statustext == null) user.statustext = 'Ready for some foos';
        user.password = hash(user.password, 'a little dog');
        try {
          return newUserRepo.create(user, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }
    }).then(function(err, newUsers, cb) {
      return callback(err, newUsers != null ? newUsers[0] : void 0);
    });
  };

  exports.getAllPlayers = function(callback) {
    var query;
    if (callback == null) callback = function() {};
    query = {};
    try {
      return newUserRepo.read(query, function(readErr, cursor) {
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

  exports.createResetPasswordToken = function(username, callback) {
    var token,
      _this = this;
    if (callback == null) callback = function() {};
    console.assert(username, 'username cannot be null');
    if (!username) throw 'username cannot be null';
    token = hash('' + Math.floor(Math.random() * 100001), 'a little dog');
    return utils.execute(newUserRepo.getByUsername, username).then(function(err, existingUser, cb) {
      var findObj, updateObj;
      _this.existingUser = existingUser;
      if (err != null) {
        return callback(err);
      } else if (existingUser != null) {
        findObj = {
          _id: existingUser._id
        };
        updateObj = {
          $set: {
            resettoken: token
          }
        };
        return newUserRepo.update(findObj, updateObj, {}, cb);
      } else {
        return callback('Account not found');
      }
    }).then(function(err, updatedUser, cb) {
      return callback(err, token, _this.existingUser);
    });
  };

  exports.getUserByToken = function(token, callback) {
    var findObj;
    if (callback == null) callback = function() {};
    console.assert(token, 'token cannot be null');
    if (!token) throw 'token cannot be null';
    findObj = {
      resettoken: token
    };
    return utils.execute(newUserRepo.read, findObj).then(function(err, cursor, cb) {
      if (cb == null) cb = function() {};
      if (err) {
        return callback(err);
      } else {
        return cursor.toArray(cb);
      }
    }).then(function(err, users, cb) {
      if (cb == null) cb = function() {};
      if (err) {
        callback(err);
      } else if ((users != null ? users.length : void 0) === 0) {
        callback('Token not found.');
      } else {
        callback(err, users[0]);
      }
      return cb();
    });
  };

  exports.setPassword = function(userid, password, callback) {
    var encryptedPassword, findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null');
    if (!((userid != null) && userid)) throw 'userid cannot be null';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    encryptedPassword = hash(password, 'a little dog');
    findObj = {
      _id: userid
    };
    updateObj = {
      $set: {
        password: encryptedPassword,
        updatedat: new Date()
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  exports.assignTeam = function(userid, team, callback) {
    var findObj, updateObj;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null');
    if (!((userid != null) && userid)) throw 'userid cannot be null';
    console.assert(team, 'team cannot be null');
    if (team == null) throw 'team cannot be null';
    if (typeof userid === 'string') userid = new newUserRepo.ObjectId(userid);
    findObj = {
      _id: userid
    };
    updateObj = {
      $set: {
        team: team,
        updatedat: new Date()
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, {}, callback);
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  take in a brief invite obj and return a full Invite object
  */

  loadFullInvite = function(invite, callback) {
    var teamid, userid;
    if (callback == null) callback = function() {};
    teamid = invite != null ? invite.teamid : void 0;
    userid = invite != null ? invite.invitor : void 0;
    try {
      return utils.execute(teamRepo.getById, teamid).then(function(err, team, cb) {
        if (cb == null) cb = function() {};
        invite.team = team;
        try {
          return newUserRepo.getById(userid, cb);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      }).then(function(err, user, cb) {
        if (cb == null) cb = function() {};
        invite.invitor = user;
        return callback(null, invite);
      });
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  /*
  GET user object with all full properties
  */

  exports.getFullUser = function(userid, callback) {
    var _this = this;
    if (callback == null) callback = function() {};
    console.assert(userid, 'userid cannot be null or 0');
    if (!userid) throw 'userid cannot be null or 0';
    return utils.execute(newUserRepo.getById, userid).then(function(err, user, cb) {
      var _ref, _ref2, _ref3;
      _this.user = user;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      if (((_ref = _this.user) != null ? _ref.team : void 0) != null) {
        try {
          return teamRepo.getById((_ref2 = _this.user) != null ? (_ref3 = _ref2.team) != null ? _ref3._id : void 0 : void 0, cb);
        } catch (e) {
          console.trace(e);
          return cb(e);
        }
      } else {
        return cb();
      }
    }).then(function(err, team, cb) {
      var postGen, _ref, _ref2, _ref3, _ref4, _ref5;
      _this.team = team;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      if ((_ref = _this.user) != null) _ref.team = _this.team;
      if ((((_ref2 = _this.user) != null ? _ref2.posts : void 0) != null) && ((_ref3 = _this.user) != null ? (_ref4 = _ref3.posts) != null ? _ref4.length : void 0 : void 0)) {
        try {
          postGen = require('./post');
          postGen.init();
          return utils.mapAsync((_ref5 = _this.user) != null ? _ref5.posts : void 0, postGen.makePostGen(_this.user), cb);
        } catch (e) {
          console.trace(e);
          return cb(e);
        }
      } else {
        return cb(null, null);
      }
    }).then(function(err, fullposts, cb) {
      var post, posts, _ref, _ref2, _ref3, _ref4, _ref5;
      if (cb == null) cb = function() {};
      if (fullposts != null) {
        posts = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = fullposts.length; _i < _len; _i++) {
            post = fullposts[_i];
            if ((post != null ? post.desc : void 0) != null) _results.push(post);
          }
          return _results;
        })();
      } else {
        posts = fullposts;
      }
      if (posts != null) {
        posts.sort(function(p1, p2) {
          return (p2 != null ? p2.createdat : void 0) - (p1 != null ? p1.createdat : void 0);
        });
      }
      if ((_ref = _this.user) != null) _ref.posts = posts;
      try {
        if (((_ref2 = _this.user) != null ? _ref2.invites : void 0) && ((_ref3 = _this.user) != null ? (_ref4 = _ref3.invites) != null ? _ref4.length : void 0 : void 0)) {
          return utils.mapAsync((_ref5 = _this.user) != null ? _ref5.invites : void 0, loadFullInvite, cb);
        } else {
          return cb();
        }
      } catch (e) {
        console.trace(e);
        return cb(e);
      }
    }).then(function(err, invites, cb) {
      var _ref, _ref2, _ref3, _ref4;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      if ((_ref = _this.user) != null) _ref.invites = invites;
      if ((_ref2 = _this.team) != null ? (_ref3 = _ref2.challenges) != null ? _ref3.length : void 0 : void 0) {
        loadChallenge = function(challenge, loadChallengeCallback) {
          if (loadChallengeCallback == null) loadChallengeCallback = function() {};
          return teamRepo.getById(challenge != null ? challenge.teamid : void 0, function(loadChallengeErr, team) {
            challenge.teamname = team != null ? team.teamname : void 0;
            return loadChallengeCallback(loadChallengeErr, challenge);
          });
        };
        return utils.mapAsync((_ref4 = _this.team) != null ? _ref4.challenges : void 0, loadChallenge, cb);
      } else {
        return cb(null, null);
      }
    }).then(function(err, challenges, cb) {
      var allmatches, async, match, matches, matchsvc, _ref;
      if (cb == null) cb = function() {};
      _this.team.challenges = challenges;
      _this.user.challenges = challenges;
      allmatches = (_ref = _this.team) != null ? _ref.matches : void 0;
      if (allmatches != null) {
        matches = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = allmatches.length; _i < _len; _i++) {
            match = allmatches[_i];
            if ((match != null ? match.status : void 0) === 'pending') {
              _results.push(match);
            }
          }
          return _results;
        })();
      }
      if (matches != null ? matches.length : void 0) {
        matchsvc = require('./match');
        async = require('async');
        loadMatch = function(am, loadMatchCb) {
          if (loadMatchCb == null) loadMatchCb = function() {};
          return matchsvc.getById(am._id, function(loadMatchErr, fullMatch) {
            var loadVote, team, vote, _fn, _fn2, _i, _j, _len, _len2, _ref2, _ref3;
            if (fullMatch != null) fullMatch.hometeam = _this.team;
            if ((fullMatch != null ? fullMatch.teams : void 0) != null) {
              _ref2 = fullMatch != null ? fullMatch.teams : void 0;
              _fn = function(team) {
                var _ref3, _ref4;
                if (!(team != null ? (_ref3 = team._id) != null ? _ref3.equals((_ref4 = _this.team) != null ? _ref4._id : void 0) : void 0 : void 0)) {
                  return fullMatch.opponentteam = team;
                }
              };
              for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
                team = _ref2[_i];
                _fn(team);
              }
            }
            if ((fullMatch != null ? fullMatch.votes : void 0) != null) {
              _ref3 = fullMatch != null ? fullMatch.votes : void 0;
              _fn2 = function(vote) {
                if (String(vote != null ? vote.playerid : void 0) === String(_this.user._id)) {
                  return fullMatch.voted = true;
                }
              };
              for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                vote = _ref3[_j];
                _fn2(vote);
              }
              loadVote = function(vote, votecb) {
                if (votecb == null) votecb = function() {};
                return newUserRepo.getById(vote.playerid, function(getByIdErr, user) {
                  vote.playername = user != null ? user.nickname : void 0;
                  return votecb(null, vote);
                });
              };
              return async.map(fullMatch != null ? fullMatch.votes : void 0, loadVote, function(loadVoteErr, fullVotes) {
                if (fullMatch != null) fullMatch.votes = fullVotes;
                return loadMatchCb(loadMatchErr, fullMatch);
              });
            } else {
              return loadMatchCb(loadMatchErr, fullMatch);
            }
          });
        };
        return async.map(matches, loadMatch, function() {
          return cb.apply(null, arguments);
        });
      } else {
        return callback(null, _this.user);
      }
    }).then(function(err, matches, cb) {
      if (cb == null) cb = function() {};
      _this.user.matches = matches;
      return callback(null, _this.user);
    });
  };

}).call(this);
