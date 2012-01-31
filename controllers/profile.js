/*
  GET
  URL /profile
  Redirect to /profile/show with current user id
*/
exports.index = function(req, res) {
  var user = req.session.user
    , userId = user._id || '';
  
  // redirect to show with current user id
  res.redirect('/profile/' + userId);  
}
exports.index.methods = ['GET'];
exports.index.authenticated = true;


/*
  GET
  URL /profile/show
*/
exports.show = function(req, res, next) {
  var userId = req.params.id || null;
  
  if (!userId) {
    req.flash('error', 'player id is empty...playa');
    next();
    //res.render(null, {
    //  layout: true
    //  , title: 'Wheels Foosball League (WFL) - Profile'
    //});
    return;
  }
  
  getUser(userId, function(error, user) {
    if (error) {
      req.flash('error', error);
      next();
    } else {
      res.render( user, {
        layout: true
        , title: 'Wheels Foosball League (WFL) - Profile'
        , user: req.session.user
      });
    }
  });
}
exports.show.methods = ['GET'];
exports.show.authenticated = true; 


/*
  get a full tree user object
*/
function getUser(userId, callback) {
  var repo = require('../repository/users')
    , utils = require('utils')
    , fullUser = null
    , loadTeamFn = function(loadTeamFnCallback) {
      loadTeamFnCallback = loadTeamFnCallback || function() {};
      loadTeamForUser(fullUser, loadTeamFnCallback);
    }
    , loadInvites = function(loadInvitesCallback) {
      loadInvitesCallback = loadInvitesCallback || function() {};
      
      if (fullUser && fullUser.invites && fullUser.invites.length) {
        utils.map(fullUser.invites, loadFullInvite, function(error, fullInvites) {
          
          if(!error) {
            fullUser.invites = fullInvites;
          }
          
          loadInvitesCallback(null, fullUser);
        });
      } else {
        loadInvitesCallback(null, fullUser);
      }     
    }
    , loadPosts = function(loadPostsCallback) {
      loadPostsCallback = loadPostsCallback || function() {};
      
      if (fullUser && fullUser.posts && fullUser.posts.length) {
        utils.map(fullUser.posts, loadFullPost, function(error, fullPosts) {

          if (!error) {
            fullUser.posts = fullPosts;
          }
    
          loadPostsCallback(null, fullUser);
        });
      } else {
        loadPostsCallback(null, fullUser);
      }
    };
  
  repo.getFullUser(userId, function(error, user) {
    if (error) {
      console.log(error);
      callback(error);
    } else {
      fullUser = user;
      
      utils.parallel([loadTeamFn, loadInvites, loadPosts], function(error) {
        
        callback(error, fullUser);
      });
            
      //loadTeamForUser(user, function(userwTeam) {
      //  console.log(userwTeam);
      //  callback(null, userwTeam);
      //});
      //callback(null, user);
    }
  });
  
  return true;
};


/*
  Load team object for user
*/
function loadTeamForUser(user, callback) {
  callback = callback || function() {};
  
  if (user && user.team && user.team._id) {
    var repo = require('../repository/teams');    
    
    repo.getFullTeam(String(user.team._id), function(error, team) {
      if (team) {
        user.team = team;
      }
      callback(error, user);
    });
  } else {
    callback(null, user);
  }
};


// take in a brief invite obj and return a full Invite object
function loadFullInvite(invite, callback) {
  var teamid = invite ? invite.teamid : null
    , userid = invite ? invite.invitor : null
    , utils = require('utils')
    , loadTeamFn = function(loadTeamCallback) {
      loadTeam(teamid, loadTeamCallback);
    }
    , loadUserFn = function(loadUserCallback) {
      loadUser(userid, loadUserCallback);
    };
    
  if (invite && teamid && userid) {
    utils.parallel([loadTeamFn, loadUserFn], function(error, results) {
      if (!error) {
        invite.team = results[0];
        invite.invitor = results[1];
      }
      
      callback(error, invite);
    });
  } else {
    callback(null, invite);
  }
}


// take in a brief post object and return a full post object
function loadFullPost(post, callback) {
  callback(null, post);
}


function loadTeam(teamid, callback) {
  var repo = require('../repository/teams');
  
  repo.getFullTeam(teamid, callback);
}


function loadUser(userid, callback) {
  var repo = require('../repository/users');
  
  repo.getFullUser(userid, callback);
}
