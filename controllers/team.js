(function() {
  var teamSvc;

  teamSvc = require('../services/team');

  exports.join = function(req, res, next) {
    var teamid, userid;
    teamid = req.param('id', '');
    userid = req.param('playerid', '');
    if (teamid && userid) {
      return teamSvc.createJoinRequest(teamid, userid, function(err) {
        return res.send({
          success: !(err != null)
        });
      });
    } else {
      return next();
    }
  };

  exports.join.authenticated = true;

  exports.join.methods = ['POST'];

  exports.join.action = ':id/join';

  /*
    POST
    URL  /team/challenge
    Post a challenge to server
  */

  exports.challenge = function(req, res, next) {
    var matchtype, msg, opponentplayerid, teamid,
      _this = this;
    teamid = req.param('challengeeteamid', '');
    opponentplayerid = req.param('challengerid', '');
    msg = req.param('challengemsg', '');
    matchtype = req.param('matchtype', '');
    if (!teamid || !opponentplayerid) {
      return res.send({
        success: false,
        error: 'Ids empty'
      });
    } else {
      return teamSvc.createTeamChallenge({
        teamid: teamid,
        opponentplayerid: opponentplayerid,
        matchtype: matchtype,
        msg: msg
      }, function(error, result) {
        if (error) {
          return res.send({
            success: false,
            error: error
          });
        } else {
          return res.send({
            success: true,
            result: result
          });
        }
      });
    }
  };

  exports.challenge.authenticated = true;

  exports.challenge.methods = ['POST'];

  /*
    POST
    URL /team/challengedecline
    Decline a challenge
  */

  exports.challengedecline = function(req, res) {
    var inputs;
    inputs = {
      challengingteamid: req.param('challengingteamid', ''),
      challengedteamid: req.param('challengedteamid', ''),
      msg: req.param('messsage', '')
    };
    try {
      if (inputs.challengingteamid && inputs.challengedteamid) {
        return teamSvc.declineChallenge(inputs, function(error, result) {
          return res.send({
            success: !error,
            error: error,
            result: result
          });
        });
      } else {
        return res.send({
          success: false,
          error: 'Ids empty'
        });
      }
    } catch (e) {
      console.trace(e);
      return res.send({
        success: false,
        error: e
      });
    }
  };

  exports.challengedecline.methods = ['POST'];

  exports.challengedecline.authenticated = true;

  /*
    POST
    URL /team/challengeaccept
    Accept a challenge, create pending match
  */

  exports.challengeaccept = function(req, res, next) {
    var inputs;
    inputs = {
      challengingteamid: req.param('challengingteamid'),
      challengedteamid: req.param('challengedteamid'),
      msg: req.param('messsage')
    };
    try {
      if (inputs.challengingteamid && inputs.challengedteamid) {
        return teamSvc.acceptChallenge(inputs, function(error, result) {
          return res.send({
            success: new Boolean(!error),
            error: error,
            result: result
          });
        });
      } else {
        return res.send({
          success: false,
          error: 'Ids empty'
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        error: e
      });
    }
  };

  exports.challengeaccept.methods = ['POST'];

  exports.challengeaccept.authenticated = true;

  /*
    POST
    URL /team/challengecancel
    Cancel a challenge
  */

  exports.challengecancel = function(req, res) {
    var inputs;
    inputs = {
      challengingteamid: req.param('challengingteamid', ''),
      challengedteamid: req.param('challengedteamid', ''),
      msg: req.param('messsage', '')
    };
    try {
      if (inputs.challengingteamid && inputs.challengedteamid) {
        return teamSvc.cancelChallenge(inputs, function(error, result) {
          return res.send({
            success: !error,
            error: error,
            result: result
          });
        });
      } else {
        return res.send({
          success: false,
          error: 'Ids empty'
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        error: e
      });
    }
  };

  exports.challengecancel.methods = ['POST'];

  exports.challengecancel.authenticated = true;

  /*
    GET
    URL /team/challenge
    return a challenge object
  */

  exports.getChallenge = function(req, res, next) {
    var challengerid, teamid;
    teamid = req.param('teamid', '');
    challengerid = req.param('challengerid', '');
    if (!teamid || !challengerid) {
      return res.send({
        success: false,
        error: 'Ids empty'
      });
    }
    try {
      return teamSvc.getTeamChallenge(teamid, challengerid, function(error, result) {
        if (error != null) {
          return res.send({
            success: false,
            error: error
          });
        } else {
          return res.send({
            success: true,
            result: result
          });
        }
      });
    } catch (e) {
      console.log(e);
      return res.send({
        success: false,
        error: e
      });
    }
  };

  exports.getChallenge.authenticated = true;

  exports.getChallenge.action = 'challenge';

  exports.getChallenge.methods = ['GET'];

  /*
    GET
    URL /team
    Render team list page
  */

  exports.index = function(req, res, next) {
    var availableOnly, utils;
    availableOnly = req.param('available', '');
    utils = require('../services/utils');
    return utils.execute(teamSvc.getAll, availableOnly).then(function(err, teams, cb) {
      var makeMemberMapper, makeTeamMapper;
      if (cb == null) cb = function() {};
      if (err != null) return next();
      makeMemberMapper = function() {
        var userSvc;
        userSvc = require('../services/user');
        return function(memberid, membermapcb) {
          if (membermapcb == null) membermapcb = function() {};
          return userSvc.getById(memberid, membermapcb);
        };
      };
      makeTeamMapper = function() {
        return function(team, teammapcb) {
          if (teammapcb == null) teammapcb = function() {};
          if (team == null) return teammapcb();
          return utils.mapAsync(team.members, makeMemberMapper(), function(err, members) {
            if (err != null) return teammapcb(err);
            team.members = members;
            return teammapcb(null, team);
          });
        };
      };
      return utils.mapAsync(teams, makeTeamMapper(), cb);
    }).then(function(err, teams, cb) {
      if (cb == null) cb = function() {};
      if ((err != null) || !(teams != null)) return next();
      teams.sort(teamSvc.sortingTeams);
      if (availableOnly) {
        return res.send(teams);
      } else {
        return res.render(teams, {
          layout: true,
          title: 'WFL - Teams'
        });
      }
    });
  };

  exports.index.authenticated = true;

  /*
    POST
    URL /team/:id
    Create a team
  */

  exports.create = function(req, res, next) {
    var team, teamname, userId, userSvc, utils,
      _this = this;
    userId = req.params.id || req.user._id;
    teamname = req.body.teamname;
    utils = require('../services/utils');
    userSvc = require('../services/user');
    team = {
      teamname: teamname,
      owner: userId,
      pictureurl: '/images/the-a-team.jpg',
      members: [userId]
    };
    return utils.execute(teamSvc.create, team).then(function(error, createdteam, cb) {
      if (cb == null) cb = function() {};
      if (error) {
        req.flash('error', error);
        return res.send({
          success: false,
          error: error
        });
      } else if (!(team != null)) {
        req.flash('error', 'Could not create team');
        return res.send({
          success: false,
          error: 'Could not create team'
        });
      } else {
        return userSvc.assignTeam(userId, team, cb);
      }
    }).then(function(err, user, cb) {
      if (cb == null) cb = function() {};
      if (String(userId) === String(req.user._id)) {
        return userSvc.getById(userId, cb);
      } else {
        return res.send({
          success: true
        });
      }
    }).then(function(err, user, cb) {
      var _ref;
      _this.user = user;
      if (cb == null) cb = function() {};
      if (!(err != null)) {
        return (_ref = req.session) != null ? _ref.regenerate(cb) : void 0;
      } else {
        return res.send({
          success: true
        });
      }
    }).then(function() {
      req.session.user = this.user;
      return res.send({
        success: true
      });
    });
  };

  exports.create.authenticated = true;

}).call(this);
