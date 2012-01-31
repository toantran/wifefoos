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
        utils.map(fullUser.posts 
          , function(post, cb) {
            loadFullPost(fullUser, post, cb);
          }
          , function(error, fullPosts) {

            if (!error) {
              fullPosts.sort( function(a, b) {
                return b.createdat - a.createdat;
              });
              fullUser.posts = fullPosts;
            }
      
            loadPostsCallback(null, fullUser);
          }
        );
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
function loadFullPost(user, post, callback) {
  if (!post) {
    callback(null, post);
    return;
  }

  var desc = ''
    , pictureurl = ''
    , utils = require('utils')
    , returnFn = function(error) {
      post.pictureurl = pictureurl;
      post.desc = desc;
      callback(error, post);
    };

  // Populate post picture url, post description (embedded HTML)  
  switch (post.type) {
    case 'jointeam':  // added into a team
      desc = '<a href="/profile/{0}">{1}</a> has been accepted by team <a href="/team/{3}">{2}</a>';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
                       
      if (post.data && post.data.teamid) {  // teamid exists, load team
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            pictureurl = team.pictureurl;
            desc = desc.replace('{2}', team.teamname)
                      .replace('{3}', String(team._id));
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }
      break;
      
    case 'invite':  // get a team invite
      desc = '<a href="/profile/{0}">{1}</a> has invited <a href="/profile/{2}">{3}</a> to join team <a href="/team/{4}">{5}</a>';
      desc = desc.replace('{2}', String(user._id))
                .replace('{3}', user.nickname);
                
      if ( post.data && post.data.teamid && post.data.playerid ) {
        utils.parallel(
          [
            function(cb) {
              loadTeam(post.data.teamid, cb);
            }
            , function(cb) {
              loadUser(post.data.playerid, cb);
            }
          ]
          , function(error, results) {
            if (!error && results && results.length) {
              var team = results[0]
                , invitor = results[1];
              
              desc = desc.replace('{0}', String(invitor._id))
                        .replace('{1}', invitor.nickname)
                        .replace('{4}', String(team._id))
                        .replace('{5}', team.teamname);
              pictureurl = invitor.pictureurl;
              returnFn();
            } else {
              returnFn(error);
            }
          }
        );
      }
      break;
      
    case 'teamjoin':  // team joining request
      desc = '<a href="/profile/{0}">{1}</a> has asked to join team <a href="/team/{3}">{2}</a>';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
                       
      if (post.data && post.data.teamid) {  // teamid exists, load team
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            pictureurl = team.pictureurl;
            desc = desc.replace('{2}', team.teamname)
                      .replace('{3}', String(team._id));
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }
      break;
    case 'recruit':  // recruit a player
      pictureurl = user.pictureurl;
      desc = '<a href="/profile/{0}">{1}</a> has asked <a href="/profile/{2}">{3}</a> to make a team';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
      
      if (post.data && post.data.playerid) {
        loadUser(post.data.playerid, function(error, invitee) {
          if (invitee) {
            desc = desc.replace('{2}', String(invitee._id))
                      .replace('{3}', invitee.nickname);
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }
      break;
    default:
      returnFn();
      break;
  }
  
  return true;    
}


function loadTeam(teamid, callback) {
  var repo = require('../repository/teams');
  
  repo.getFullTeam(teamid, callback);
}


function loadUser(userid, callback) {
  var repo = require('../repository/users');
  
  repo.getFullUser(userid, callback);
}
