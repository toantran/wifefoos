(function() {
  var teamSvc;

  teamSvc = require('../services/team');

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

}).call(this);
