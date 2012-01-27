
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



function createNewTeamPost(user, team, callback) {
  var repo = require('../repository/users')
    , mongo = require('mongodb');
  
  repo.getFullUser(String(user._id), function(error, user) {
    if (error) {
      console.log(error);
      callback(error);
    } else {
      var posts = user.posts || [];
      posts.push({
        id: new mongo.ObjectID()
        , userId: String(user._id)
        , comment: 'You have just created a team!'
        , ccreatedAt: new mongo.Timestamp()
      });
      
      user.posts = posts;
      
      repo.saveUser(user, function( error, user) {
        callback(error, user);
      });
    }
  });
}


function getTeam(teamId, callback) {
    var repo = require('../repository/teams');
  
  repo.getFullTeam(teamId, callback);
}

function createTeam(teamname, ownerId, callback) {
  var repo = require('../repository/teams')
    , team = {
      teamname: teamname,
      owner: ownerId,
      members: [ownerId]
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
      user.team = team;
      
      repo.saveUser(user, function( error, user) {
        callback(error, user);
      });
    }
  });
}
