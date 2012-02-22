(function() {
  var crypto, hash, loadChallenge, loadChallenges, loadMatch, loadMatches, loadUserTeam, newUserRepo, teamRepo, utils;

  crypto = require('crypto');

  newUserRepo = require('../repository/users2');

  teamRepo = require('../repository/teams');

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
      console.log('encryptedPassword %s   user.password %s', encryptedPassword, user.password);
      if (error) {
        return callback(error);
      } else if (!user) {
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
        posts: statLog
      }
    };
    try {
      return newUserRepo.update(findObj, updateObj, callback);
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
      return newUserRepo.update(findObj, updateObj, callback);
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
      return newUserRepo.update(findObj, updateObj, callback);
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
      return newUserRepo.update(findObj, updateObj, callback);
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
      return newUserRepo.update(findObj, updateObj, callback);
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
      return newUserRepo.update(findObj, updateObj, callback);
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
        var post, _i, _len, _ref, _ref2;
        if (getErr != null) return callback(getErr);
        _ref = user != null ? user.posts : void 0;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          post = _ref[_i];
          if (post != null ? (_ref2 = post.id) != null ? _ref2.equals(postid) : void 0 : void 0) {
            post.comments || (post.comments = []);
            post.comments.push(data);
          }
        }
        return newUserRepo.save(user, callback);
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
      return newUserRepo.update(findObj, updateObj, callback);
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

}).call(this);
