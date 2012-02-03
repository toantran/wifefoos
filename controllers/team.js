


/*
  POST
  URL /team/challengedecline
  Decline a challenge, create pending match
*/
exports.challengedecline = function(req, res) {
  var inputs = {
    challengingteamid : req.param('challengingteamid')
    , challengedteamid : req.param('challengedteamid')
    , msg : req.param('messsage')
  };
    
  if (inputs.challengingteamid && inputs.challengedteamid) {
    declineChallenge( inputs, function(error, result) {
      res.send({
        success: new Boolean(!error)
        , error: error
        , result: result
      });
    });
  } else {
    res.send({
      success: false
      , error: 'Ids empty'
    });
  }
}
exports.challengedecline.methods = ['POST'];
exports.challengedecline.authenticated = true;



/*
  POST
  URL /team/challengeaccept
  Accept a challenge, create pending match
*/
exports.challengeaccept = function(req, res) {
  var inputs = {
    challengingteamid : req.param('challengingteamid')
    , challengedteamid : req.param('challengedteamid')
    , msg : req.param('messsage')
  };
  
  acceptChallenge(inputs, function(error, result) {
    res.send({
        success: new Boolean(!error)
        , error: error
        , result: result
      });
  });  
}
exports.challengeaccept.methods = ['POST'];
exports.challengeaccept.authenticated = true;


/*
  
*/
exports.challengecancel = function(req, res) {
  var inputs = {
    challengingteamid : req.param('challengingteamid')
    , challengedteamid : req.param('challengedteamid')
    , msg : req.param('messsage')
  };
    
  if (inputs.challengingteamid && inputs.challengedteamid) {
    cancelChallenge( inputs, function(error, result) {
      res.send({
        success: new Boolean(!error)
        , error: error
        , result: result
      });
    });
  } else {
    res.send({
      success: false
      , error: 'Ids empty'
    });
  }
}
exports.challengecancel.methods = ['POST'];
exports.challengecancel.authenticated = true;



/*
  GET
  URL /team/challenge
  return a challenge object
*/
exports.getChallenge = function(req, res, next) {
  var teamid = req.param('teamid')
    , challengerid = req.param('challengerid');
    
  if (!teamid || !challengerid) {
    res.send({success: false, error: 'Ids empty'});
    return false;
  }
    
  getTeamChallenge( teamid, challengerid, function(error, result) {
    if (error) {
      res.send({success: false, error: error});
      return false;
    } else {
      res.send(result);
    }
  });
  
  return true;
}
exports.getChallenge.authenticated = true;
exports.getChallenge.action = 'challenge';
exports.getChallenge.methods = ['GET'];



/*
  POST
  URL  /team/challenge
  Post a challenge to server
*/
exports.challenge = function(req, res, next) {
  var teamid = req.param('teamid')
    , opponentplayerid = req.param('challengerid')
    , msg = req.param('challengemsg')
    , matchtype = req.param('matchtype');
    
  if (!teamid || !opponentplayerid) {
    res.send({success: false, error: 'Ids empty'});
    return false;
  }
  
  createTeamChallenge({
    teamid: teamid
    , playerid: opponentplayerid
    , matchtype: matchtype
    , msg: msg
  }, function(error, result) {
    if (error) {
      res.send({
        success: false
        , error: error
      });
    } else {
      res.send({
        success: true
        , result: result
      });
    }
  });
  
  return true;
}
exports.challenge.authenticated = true;
exports.challenge.methods = ['POST'];


/*
  GET
  URL /team/available
  Get a list of available to join teams
*/
exports.available = function (req, res, next) {
  getAllTeams( function(error, teams) {
    if (error || !teams || typeof(teams.length) === 'undefined') {
      res.send({success: false});
    } else {
      var availableTeams = [];
      for(team in teams) {
        if (!team.members || (team.members.length <= 1)) {
          availableTeams.push(team);
        }
      }
      
      res.send(availableTeams);
    }
  });
}
exports.available.methods = ['GET'];
exports.available.authenticated = true;


/*
  GET
  URL /team
  Render team list page
*/
exports.index = function(req, res, next) {
  var availableOnly = req.param('available');
  
  getAllTeams( function(error, teams) {
    if (error || !teams || typeof(teams.length) === 'undefined') {
      res.send({success: false});
    } else {    
      if (availableOnly) {
        var availableTeams = [];
        for(var i = 0; i < teams.length; i++) {
          var team = teams[i];
          if (!team.members || (team.members.length <= 1)) {
            availableTeams.push(team);
          }
        }      
        res.send(availableTeams);
      } else {
        res.render(teams, {
          layout: true
          , title: 'Wheels Foosball League (WFL) - Teams'
          , user: req.session.user
        });
      }
    }
  });
}
exports.index.authenticated = true;


/*
  GET
  URL /team/:id/add
  Render the team adding page
*/
exports.add = function(req, res, next) {
  var userId = req.params.id || req.session.user._id;
  
  res.render(null, {
    layout: true
    , user: req.session.user
    , userId: userId
    , title: 'Wheels Foosball League (WFL) - Create new team'
  });
}
exports.add.authenticated = true;


/*
  POST
  URL /team/:id
  Create a team
*/
exports.create = function(req, res, next) {
  var userId = req.params.id || req.session.user._id
    , teamname = req.body.teamname;
  
  createTeam(teamname, userId, function(error, team) {
    if (error) {
      req.flash('error', error);
      res.redirect('back');
    } else if (!team) {
      req.flash('error', 'DB error');
      res.redirect('back');
    } else {
      assignTeamToUser(team, userId, function(error, user) {      
        if (!error) {          
          createNewTeamPost(userId, team, function() {                   
          });
          
          if (user && req.session.user._id == user._id) {
            req.session.user = user;
          }
        }
        res.redirect('/team/' + team._id);      
      });
    }
  });
}
exports.create.authenticated = true;


/*
  GET
  URL /team/:id
  Render a team detail page
*/
exports.show = function(req, res, next) {
  var teamId = req.params.id;
  
  getTeam(teamId, function(error, team) {
    if (error) {
      req.flash('error', error);
    }
    
    res.render(team, {
      layout: true
      , title: 'Wheels Foosball League (WFL)'
      , user: req.session.user
    })
  }); 
}
exports.show.authenticated = true; 


function createNewTeamPost(userid, team, callback) {
  var repo = require('../repository/users')
    , mongo = require('mongodb')
    , post = {
      type: 'newteam'
      , data: {
        teamid: String(team._id)
      }
    };
    
  repo.addPost(userid, post, function(error, savedUser) {
    callback(error, savedUser);
  });
    
  return true;
}


function getTeam(teamId, callback) {
  var repo = require('../repository/teams');
  
  repo.getFullTeam(teamId, callback);
}

function createTeam(teamname, ownerId, callback) {
  var repo = require('../repository/teams')
    , team = {
      teamname: teamname
      , owner: ownerId
      , pictureurl: '/images/the-a-team.jpg'
      , members: [ownerId]
    };
  
  repo.insertTeam(team, callback);  
}

function assignTeamToUser(team, userId, callback) {
  var repo = require('../repository/users');
  
  repo.setTeam( userId, team, callback );
}

function getAllTeams(callback) {
  var repo = require('../repository/teams');
  
  repo.getAll( function(error, teams) {
    if (error) {
      callback(error);
    } else {
      callback(null, teams);
    }
  });
}


function createTeamChallenge(inputs, callback) {
  var repo = require('../repository/teams')
    , userRepo = require('../repository/users')
    , utils = require('utils')
    , challenge = {
      message: inputs.msg
      , matchtype: inputs.matchtype
    };
  
  callback = callback || function() {};
  
  if (!inputs || !inputs.teamid || !inputs.playerid) {
    callback('Ids empty');
    return false;
  }
  
  userRepo.getFullUser(inputs.playerid, function(error, user) {
    if (!error && user.team) {
      challenge.teamid = String(user.team._id);
    }
    
    // check if team has been challenged by the same team  
    getTeamChallenge( inputs.teamid, challenge.teamid, function(error, result) {
      
      // challenge exists
      if (result) {
        callback('Team already has a pending challenge');
      } else {      
      // challenge not found
      
        repo.addChallenged(inputs.teamid, challenge, function(error, team) {
      
          if (error) {
            callback(error);
            return false;
          }
          
          callback(null, team);
          
          // successfully added challenge to challenged team, now, create posts in team's members 
          if (team && team.members && team.members.length) {

            var post = {
              type: 'teamchallenged'
              , data: {
                teamid: challenge.teamid
                , msg: inputs.msg
                , matchtype: inputs.matchtype
              }
            };

            addMemberPost(team.members, post, function(error, result) {});
            
            /*
            utils.map(team.members, function(memberid, cb) {
              
              if (memberid) {
                userRepo.addPost(memberid, post, cb);
              } else {
                cb();
              }
              
              return true;
              
            }, function(err, result) {
              if (err) {
                console.log(err);
              }
            } );  
            
            */
          }
          
          // create challenge record for challenging team
          createTeamChallenging({
            teamid: challenge.teamid
            , challengedteamid: inputs.teamid
            , msg: inputs.msg
            , matchtype: inputs.matchtype
          }, function() {});
        });
      }
    });
  
  });
  return true;
}



function createTeamChallenging(inputs, callback) {
  var repo = require('../repository/teams')
    , userRepo = require('../repository/users')
    , utils = require('utils')
    , challenge = {      
      message: inputs.msg
      , teamid: inputs.challengedteamid
      , matchtype: inputs.matchtype
    };
  
  callback = callback || function() {};
  
  if (!inputs || !inputs.teamid || !inputs.challengedteamid) {
    callback('Ids empty');
    return false;
  }

  repo.addChallenging(inputs.teamid, challenge, function(error, team) {
  
    if (error) {
      callback(error);
      return false;
    }
    
    callback(null, team);
    
    // successfully added challenge to challenging team, now, create posts in team's members 
    if (team && team.members && team.members.length) {

      var post = {
        type: 'teamchallenging'
        , data: {
          teamid: inputs.challengedteamid
          , msg: inputs.msg
          , matchtype: inputs.matchtype
        }
      };

      addMemberPost(team.members, post, function(error, result) {});
      
      /*
      utils.map(team.members, function(memberid, cb) {
        
        if (memberid) {
          userRepo.addPost(memberid, post, cb);
        } else {
          cb();
        }
        
        return true;
        
      }, function(err, result) {
        if (err) {
          console.log(err);
        }
      } ); 
      */
    }           
  });

  return true;
}


function getTeamChallenge(teamid, challengerid, callback) {
  callback = callback || function() {};
  
  if (!teamid || !challengerid ) {
    callback('Ids empty');
    return false;
  }
  
  var repo = require('../repository/teams');
  
  repo.getFullTeam( teamid, function(error, team) {
    if (error || !team) {
      callback(error);
      return false;
    }
    
    if (team.challenges && team.challenges.length) {
      var challenge = null;
          
      team.challenges.forEach( function(e) {
        if (e && e.teamid === challengerid) {
          challenge = e;
        }
      });
      
      if (challenge) {
        repo.getFullTeam(challenge.teamid, function(err, challenger) {
          if (!err) {
            challenge.team = challenger;
          }
          
          callback(null, challenge);
        });
      } else {
        callback();
      }
    } else {
      callback();
    }  
  });
  
  return true;
}


function cancelChallenge(inputs, callback) {
  callback = callback || function() {};
  
  var repo = require('../repository/teams');
  
  repo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid, function( error, result ) {
    
    if (error) {
      console.log(error);
      callback(error);
    } else {
      repo.removeChallenge(inputs.challengingteamid, inputs.challengedteamid, function( error, result) {
        callback(error, result);        
        
        if (!error) {
          // create logs for team members
          if (result.members && result.members.length === +result.members.length) {
            var cancellingLog = {
              type: 'challengecancelled'
              , data: {
                teamid: inputs.challengedteamid
                , msg: 'Regret much?'
              }
              , createdat: new Date()
            };
            
            addMemberPost(result.members, cancellingLog, function(error, result) {});
          }
        }
      } );
      
      
      // create logs for team members
      if (result.members && result.members.length === +result.members.length) {
        var cancellingLog = {
          type: 'challengeremoved'
          , data: {
            teamid: inputs.challengingteamid
            , msg: 'Regret much?'
          }
          , createdat: new Date()
        };
        
        addMemberPost(result.members, cancellingLog, function(error, result) {});
      }
    }
  });       
}


function declineChallenge(inputs, callback) {
  callback = callback || function() {};
  
  var repo = require('../repository/teams');
  
  repo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid, function( error, result ) {
    
    if (error) {
      console.log(error);
      callback(error);
    } else {
      repo.removeChallenge(inputs.challengingteamid, inputs.challengedteamid, function( error, result) {
        callback(error, result);        
        
        if (!error) {
          // create logs
          if (result.members && result.members.length === +result.members.length) {
            var cancellingLog = {
              type: 'challengedeclined'
              , data: {
                teamid: inputs.challengedteamid
                , msg: 'Chicken dance'
              }
              , createdat: new Date()
            };
            
            addMemberPost(result.members, cancellingLog, function(error, result) {});
          }
        }
      } );
      
      
      // create logs
      if (result.members && result.members.length === +result.members.length) {
        var cancellingLog = {
          type: 'challengedeclining'
          , data: {
            teamid: inputs.challengingteamid
            , msg: 'Chicken dance'
          }
          , createdat: new Date()
        };
        
        addMemberPost(result.members, cancellingLog, function(error, result) {});
      }
    }
    
  });       
}


function acceptChallenge(inputs, callback) {
  callback = callback || function() {};
  
  var matchRepo = require('../repository/matches')
    , teamRepo = require('../repository/teams')
    , utils = require('utils')
    , d = new Date()
    , am = {
      start: d
      , end: new Date(d.setDate( d.getDate() + 3))  // ends after 3 days
      , status: 'pending'
    }
    , teamids = [inputs.challengingteamid, inputs.challengedteamid];
    
  // getting all involved teams
  utils.map(teamids, teamRepo.getFullTeam, function(error, teams) {
    if (error) {
      callback(error);
      return false;
    }
    
    am.teams = teams;
    
    matchRepo.insertMatch(am, function( error, result ) {
      if (error) {
        callback(error);
        return false;
      }
      
      // adding match to teams
      teamRepo.addMatch(teamids, result, function(error) {
        if(error) {
          callback(error);
          return false;
        }
        
        callback(null, result);
        return true;
      });
      
      // remove challenges from teams
      teamRepo.removeChallenge(inputs.challengingteamid, inputs.challengedteamid, function(error) {
        if (error) {
          console.log(error);
        }
      });
      
      teamRepo.removeChallenge(inputs.challengedteamid, inputs.challengingteamid, function(error) {
        if (error) {
          console.log(error);
        }
      });
      
      // adding logs to members
      var memberids = []
        , memberPost = {
          type: 'newmatch'
          , data: {
            matchid: String(result._id)
          }
          , createdat: new Date()
        };
        
      teams.forEach(function(t) {
        memberids = memberids.concat(t.members);
      });
      
      console.log(memberids);
      
      addMemberPost(memberids, memberPost, function(err) {});
    });
  });
}



/*
*/
function addMemberPost(ids, post, callback) {
  if (!ids) {
    callback('Ids empty');
  }
  
  var utils = require('utils')
    , userRepo = require('../repository/users');
    
  if (ids.length === +ids.length) { // is array
    utils.map(ids, function(memberid, cb) {
      if (memberid) {
        userRepo.addPost(memberid, post, cb);
      } else {
        cb();
      }
      
      return true;
      
    }, function(err, result) {
      if (err) {
        console.log(err);
      } 
      
      callback(err, result);
    } );  
  } else {
    userRepo.addPost(ids, post, callback);
  }
}












