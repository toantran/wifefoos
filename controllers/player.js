

/*
  GET
  URL: /player
  Return a list of all players
*/
exports.index = function (req, res, next) {
  var availableOnly = req.param('available') || false;
  
  getAllPlayers(availableOnly,  function(err, players) {
    
    console.log(err, players);
    
    if (err) {
      req.flash('error', err);
    }
    
    if (availableOnly) {
      res.send(players);
    } else {
      res.render(players, {
        layout: true
        , title: 'Wheels Foosball League (WFL) - Players'
      });
    }
  });
};
exports.index.methods = ['GET'];
exports.index.authenticated = true;


/*
  POST
  URL /player/jointeam
  Create a joining request in team document
*/
exports.jointeam = function(req, res, next) {
  var teamid = req.param('teamid') || ''
    , userid = req.param('userid') || ''
    , format = req.param('format') || ''
    , result = {
      success: false
      , msg: 'id empty'
    }
    , callback = function(error) {
      if (!error) {
        result.success = true;        
      }
      
      if (format === 'json') {
        res.send(result);
      } else {
        res.render( result, {
          layout: true,
          title: 'Wheels Foosball League'
        });
      }
    };
  
  if (teamid && userid) {
    sendTeamJoinRequest(teamid, userid, callback);
  } else {
    callback();
  }
};
exports.jointeam.methods = ['POST'];
exports.jointeam.authenticated = true;


/*
  POST
  URL /player/invite
  Invite a player to join a team
*/
exports.invite = function( req, res, next ) {
  var teamid = req.param('teamid') || ''
    , userid = req.param('playerid') || ''
    , invitorid = req.param('invitorid') || ''
    , result = {
      success: false
      , msg: 'id empty'
    }
    , callback = function(error, inviteRequest) {
      if (error) {
        result.error = error
      } else {
        result.success = true;
      }
      
      res.send(result);
    };
    
  if (teamid && userid && invitorid) {
    createTeamInvite( userid, teamid, invitorid, callback);
  } else {
    callback('id empty');
  }
  
  return true;
}
exports.invite.methods = ['POST'];
exports.invite.authenticated = true;


/*
  POST
  URL /player/acceptinvite
  Player accept a team invite
*/
exports.acceptinvite = function(req, res, next) {
  var teamid = req.param('teamid') || ''
    , userid = req.param('userid') || ''
    , result = {
      success: false
      , error: 'Unknown'
    };
    
  
  addPlayerToTeam(teamid, userid, function(error, team) {
    if (!error && team) {
      result.success = true;
      updateUserTeam(userid, team, function(error, user) {
        if (!error && user) {
          // refresh user in session          
          if (req.session.user._id === user._id) {
            req.session.user = user;
          }
        }
      });
    } else {
      result.error = error;
    }
    res.send(result);
  });
}
exports.acceptinvite.methods = ['POST'];
exports.acceptinvite.authenticated = true;


function updateUserTeam(userid, team, callback) {
  var userRepo = require('../repository/users')
    , joiningTeamPost = {
      type: 'jointeam'
      , data: {
        teamid: String(team._id)
      }
    }
    , utils = require('utils')
    , setTeamFn = function(setTeamCallback) {
      userRepo.setTeam(userid, team, setTeamCallback);
    }
    , addPostFn = function(addPostCallback) {
      userRepo.addPost(userid, joiningTeamPost, addPostCallback);
    };

  console.log('updateUserTeam');  
  
  utils.parallel([setTeamFn, addPostFn], function(error, results) {
    var user = results && results.length ? results[0] : null;
    
    callback(error, user);
  });
}


function addPlayerToTeam(teamid, userid, callback) {
  var teamRepo = require('../repository/teams');
    
  teamRepo.addPlayer(teamid, userid, callback);
}


/*
  get all players
*/
function getAllPlayers( availableOnly, callback ) {
  var repo = require('../repository/users');
  
  if (typeof availableOnly === 'function') {
    callback = availableOnly;
    availableOnly = false;
  }
  
  repo.getAllUsers( function(error, players) {
    if (!error && availableOnly) {
      var utils = require('utils');
      
      utils.map(players, function(player, fn) {
        if (!player.team) {
          fn(null, player);
        } else {
          fn();
        }
      }, function(err, results) {
        if (err) {
          callback(err);
        } else {
          var availplayers = [];
          
          for (var i = 0; i < results.length; i++) {
            if (results[i]) {
              availplayers.push(results[i]);
            }
          }
          
          callback(null, availplayers);
        }
      });
      
    } else {
      callback(error, players);
    }
  });
}


function sendTeamJoinRequest(teamid, userid, callback) {
  var joiningRequest = {
    requestor: userid
  }
  , repo= require('../repository/teams')
  , userRepo= require('../repository/users');
  
  callback = callback || function() {};
  
  repo.addJoinRequest(teamid, joiningRequest, function(error) {
    if (error) {
      console.log(error);
      callback(error);
    } else {
      callback(null, joiningRequest);
      
      var userPost = {
        type: 'teamjoin'
        , data: {
          teamid: teamid
        }
      };      
      
      userRepo.addPost(userid, userPost);
    }
  });
}


function createTeamInvite(userid, teamid, invitorid, callback) {
  var utils = require('utils')
      , userRepo = require('../repository/users')
      , inviteDate = new Date()
      , invite = {
        teamid: teamid
        , invitor: invitorid
      }
      , invitingPost = {
        type: 'recruit'
        , data: {
          playerid: userid
        }
        , createdat: inviteDate
      }
      , invitedPost = {
        type: 'invite'
        , data: {
          teamid: teamid
          , playerid: invitorid
        }
        , createdat: inviteDate
      }
      , insertInviteFn = function(insertInviteCallback) {
        userRepo.addInvite(userid, invite, insertInviteCallback);
      }
      , insertInvitingPostFn = function(insertInvitingPostCallback) {
        userRepo.addPost(invitorid, invitingPost, insertInvitingPostCallback);
      }
      , insertInvitedPostFn = function(insertInvitedPostCallback) {
        userRepo.addPost(userid, invitedPost, insertInvitedPostCallback);
      }
      , runIt = function(fn, runItCallback) {
        if (typeof fn === 'function') {
          fn(runItCallback);
        } else {
          runItCallback(null, null);
        }
      };
    
  utils.map([insertInviteFn, insertInvitingPostFn, insertInvitedPostFn], runIt, function(error, result) {
    if (error) {
      callback(error);
    } else {
      callback(null, invite);
    }
  });
}




