

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
  
  console.log(userId, ' create team ', teamname);
    
  createTeam(teamname, userId, function(error, team) {
    if (error) {
      req.flash('error', error);
      res.redirect('back');
    } else if (!team) {
      req.flash('error', 'DB error');
      res.redirect('back');
    } else {
      console.log('created team ', team);
      assignTeamToUser(team, userId, function(error, user) {
        if (!error) {
          createNewTeamPost(user, team, function() {
            
          });
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


exports.available = function (req, res) {
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


function createNewTeamPost(user, team, callback) {
  var repo = require('../repository/users')
    , mongo = require('mongodb')
    , post = {
      type: 'newteam'
      , data: {
        teamid: team._id
      }
    };
    
  repo.addPost(String(user._id), post, function(error, savedUser) {
    callback(error, savedUser);
  });
    
  /*
  repo.getFullUser(String(user._id), function(error, fullUser) {
    if (error) {
      console.log(error);
      callback(error);
    } else {
      var posts = fullUser.posts || [];
      posts.push({
        id: new mongo.ObjectID()
        , userId: String(fullUser._id)
        , comment: 'You have just created a team!'
        , createdat: new mongo.Timestamp(new Date())
      });
      
      fullUser.posts = posts;
      
      repo.saveUser(fullUser, function( error, savedUser) {
        callback(error, savedUser);
      });
    }
  });
  */
  
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
  
  repo.getFullUser(userId, function(error, user) {
    if (error) {
      console.log(error);
      callback(error);
    } else {
      repo.setTeam( userId, team, callback );
    }
  });
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
