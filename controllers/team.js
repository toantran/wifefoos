exports.challenge = function(req, res, next) {
  var teamid = req.param('teamid')
    , opponentplayerid = req.param('challengerid');
    
  if (!teamid || !opponentplayerid) {
    res.send({success: false, error: 'Ids empty'});
    return false;
  }
    
  createTeamChallenge({teamid: teamid, playerid: opponentplayerid}, function(error, result) {
    res.send(result);
  });
  
  return true;
}
exports.challenge.authenticated = true;
exports.challenge.methods = ['POST'];


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


exports.index = function(req, res, next) {
  var availableOnly = req.param('available');
  
  getAllTeams( function(error, teams) {
    console.log('All teams ', teams);
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


exports.add = function(req, res, next) {
  var userId = req.params.id || req.session.user._id;
  
  console.log(userId);
  res.render(null, {
    layout: true
    , user: req.session.user
    , userId: userId
    , title: 'Wheels Foosball League (WFL) - Create new team'
  });
}
exports.add.authenticated = true;


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
  var repo = requrire('../repository/teams')
    , userRepo = require('../repository/users')
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
    
    repo.addChallenge(teamid, challenge, function(error, team) {
      callback(error, team);
    });
  });
  return true;
}
