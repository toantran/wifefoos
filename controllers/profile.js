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
  
  console.log('showing user ', userId);
  
  if (userId === 'undefined') {
    res.send(userId);
    return;
  }
  
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
  POST
  URL /profile/:id/addpost
*/
exports.addPost = function(req, res, next) {
  var userid = req.params.id
    , posterid = req.param('posterid')
    , msg = req.param('msg')
    , post = {
      type: 'post'
      , data: {
        posterid: posterid
        , msg: msg
      }
      , createdat: new Date()
    };
  
  if (!userid) {
    res.send();
    return false;
  }

  addUserPost(userid, post, function(error, fullPost) {
    var result = {
      success: true
    };
    
    if (error) {
      result.success = false;
      result.error = error;
    } else {
      result.post = fullPost;
    }
    
    res.send(result);
    
    return true;
  });
  
  return true;
}
exports.addPost.authenticated = true;
exports.addPost.action = ':id/addpost';
exports.addPost.methods = ['POST'];



/*
  POST
  URL /profile/:id/removepost
*/
exports.removePost = function(req, res, next) {
  var userid = req.params.id
    , postid = req.param('postid');
  
  if (!userid) {
    res.send();
    return false;
  }

  removeUserPost(userid, postid, function(error, post) {
    var result = {
      success: true
    };
    
    if (error) {
      result.success = false;
      result.error = error;
    } else {
      result.post = post;
    }
    
    res.send(result);
    
    return true;
  });
  
  return true;
}
exports.removePost.authenticated = true;
exports.removePost.methods = ['POST'];
exports.removePost.action = ':id/removepost';


/*
  POST
  URL /profile/:id/addcomment
*/
exports.addcomment = function(req, res, next) {
  var userid = req.params.id
    , postid = req.param('postid')
    , posterid = req.param('posterid')
    , msg = req.param('msg');
    
  addPostComment(userid, postid, posterid, msg, function(error, comment) {
    var result = {
      success: true
    };
    
    if (error) {
      result.success = false;
      result.error = error;
      res.send(result);
    } else {
      loadFullComment(comment, function(error, fullComment) {
        if (error) {
          result.comment = comment;
        } else {
          result.comment = fullComment;
        }
        res.send(result);
      });      
    }
    
    
    return true;
  });
  
  return true;
}
exports.addcomment.authenticated = true;
exports.addcomment.methods = ['POST'];
exports.addcomment.action = ':id/addcomment';



function addPostComment(userid, postid, posterid, msg, callback) {
  var userRepo = require('../repository/users');

  callback = callback || function() {};
  
  userRepo.addComment(userid, postid, {posterid: posterid, msg: msg}, callback);
}



function removeUserPost(userid, postid, callback) {
  var userRepo = require('../repository/users');
  
  callback = callback || function() {};
  
  userRepo.removePost(userid, postid, callback);
  
  return true;
}




function addUserPost(userid, post, callback) {
  var userRepo = require('../repository/users');
  
  callback = callback || function() {};
  
  userRepo.addPost( userid, post, function(error, user) {
    if (error) {
      callback(error);
    }
    
    if (user) {
      loadFullPost( user, post, callback );
    } else {
      
      userRepo.getFullUser(userid, function(error, fullUser) {
        if (error || !fullUser) {
          callback(error);
          return false;
        }
        
        loadFullPost(fullUser, post, callback);
      });
      
    }
    
    return true;
  });
  
  return true;
}



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
      
      if (post.comments) {
        loadPostComments(post, function(error, fullComments) {
          post.comments = fullComments;
          callback(error, post);
        });
      } else {
        callback(error, post);
      }
    };

  // Populate post picture url, post description (embedded HTML)  
  switch (post.type) {
    case 'jointeam':  // added into a team
      pictureurl = user.pictureurl || '';            
      desc = '<a href="/profile/{0}">{1}</a> joined team <a href="/team/{3}">{2}</a>';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
                       
      if (post.data && post.data.teamid) {  // teamid exists, load team
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
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
      desc = '<a href="/profile/{0}">{1}</a> invited <a href="/profile/{2}">{3}</a> to join team <a href="/team/{4}">{5}</a>';
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
              pictureurl = invitor.pictureurl || '';
              returnFn();
            } else {
              returnFn(error);
            }
          }
        );
      }
      break;
      
    case 'teamjoin':  // team joining request
      desc = '<a href="/profile/{0}">{1}</a> asked to join team <a href="/team/{3}">{2}</a>';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
                       
      if (post.data && post.data.teamid) {  // teamid exists, load team
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            pictureurl = team.pictureurl || '';
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
      pictureurl = user.pictureurl || '';
      desc = '<a href="/profile/{0}">{1}</a> asked <a href="/profile/{2}">{3}</a> to make a team';
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
    
    case 'newteam':  
      pictureurl = user.pictureurl || '';
      desc = '<a href="/profile/{0}">{1}</a> created team <a href="/team/{2}">{3}</a>';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
      
      if (post.data && post.data.teamid) {  // teamid exists, load team
        loadTeam(post.data.teamid, function(error, team) {
          
          if (team) {
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }                 
      break;
      
    case 'teamchallenging':
      pictureurl = user.pictureurl || '';
      desc = '<a href="/profile/{0}">{1}</a> challenged team <a href="/team/{2}">{3}</a>';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);

      if (post.data && post.data.matchtype) {
        desc += ' in ' + matchtypetext(post.data.matchtype);
      }
      if (post.data && post.data.msg) {
        desc += ' with message: "' + post.data.msg + '"';
      }
      
      if (post.data && post.data.teamid) {  // teamid exists, load team
        loadTeam(post.data.teamid, function(error, team) {
          
          if (team) {
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));
                      
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }        
      break;
    
    case 'teamchallenged':
      pictureurl = user.pictureurl || '';
      desc = 'Team <a href="/team/{2}">{3}</a> challenged <a href="/profile/{0}">{1}</a>';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);

      if (post.data && post.data.matchtype) {
        desc += ' in ' + matchtypetext(post.data.matchtype);
      }
      if (post.data && post.data.msg) {
        desc += ' with message: "' + post.data.msg + '"';
      }
            
      if (post.data && post.data.teamid) {  // teamid exists, load team
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            pictureurl = team.pictureurl || '';
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));            
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }        
      break;
    
    case 'newmatch':
      pictureurl = '/images/match.jpg';
      desc = 'A match between <a href="{0}">{1}</a> and <a href="{2}">{3}</a> was set!  Match will expire on {4}.  Game on!';
            
      if (post.data && post.data.matchid) {  // matchid exists, load match
        loadMatch(post.data.matchid, function(error, m) {        
          
          console.log('matchid = ', post.data.matchid, error, m);                    
          if (m && m.teams) {
            
            var team1 = m.teams[0]
              , team2 = m.teams[1]
              , expire = (m.end.getMonth()+1) + '/' + m.end.getDate() + '/' + m.end.getFullYear() + ' ' + m.end.getHours() + ':' + m.end.getMinutes();
              
            desc = desc.replace('{1}', team1.teamname)
                      .replace('{0}', String(team1._id))
                      .replace('{3}', team2.teamname)
                      .replace('{2}', String(team2._id))
                      .replace('{4}', expire);            
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }        
      break;
      
    case 'challengedeclined':
      pictureurl = user.pictureurl || '';
      desc = 'Team <a href="/team/{2}">{3}</a> declined a challenge from <a href="/profile/{0}">{1}</a>. They\'re too scared, maybe?';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
            
      if (post.data && post.data.teamid) {  // teamid exists, load team        
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            pictureurl = team.pictureurl || '';
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));            
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }       
      break;
    
    case 'challengedeclining':
      pictureurl = user.pictureurl || '';
      desc = '<a href="/profile/{0}">{1}</a> declined a challenge from team <a href="/team/{2}">{3}</a>. Chicken much?';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
            
      if (post.data && post.data.teamid) {  // teamid exists, load team        
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));            
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }       
      break;
      
    case 'challengecancelled':
      pictureurl = user.pictureurl || '';
      desc = '<a href="/profile/{0}">{1}</a> cancelled a challenge to team <a href="/team/{2}">{3}</a>. Regret much?';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
            
      if (post.data && post.data.teamid) {  // teamid exists, load team        
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));            
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }
      break;
      
    case 'challengeremoved':
      pictureurl = user.pictureurl || '';
      desc = 'Team <a href="/team/{2}">{3}</a> withdrew a challenge to <a href="/profile/{0}">{1}</a>. Maybe they think it\'s not a wise thing to do?';
      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
            
      if (post.data && post.data.teamid) {  // teamid exists, load team        
        loadTeam(post.data.teamid, function(error, team) {
          if (team) {
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));            
          }
          returnFn(error);
        });
      } else {
        returnFn();
      }
      break;
      
    case 'post':
      desc = '<a href="/profile/{0}">{1}</a> wrote: <div>{2}</div>';
      desc = desc.replace('{2}', post.data ? post.data.msg || '' : '');
      
      if (post.data && post.data.posterid) {
        loadUser( post.data.posterid, function(error, poster) {
          if(poster) {
            pictureurl = poster.pictureurl || '';
            desc = desc.replace('{0}', String(poster._id))
                      .replace('{1}', poster.nickname);
          }
          
          returnFn( error );
        } );
      } else {
        returnFn();
      }
      
      break;
      
    case 'matchresult':
      pictureurl = user.pictureurl || '';
      
      if (post.data) {
        if ((post.data.result || 'win') === 'win') {
          desc = '<a href="/profile/{0}">{1}</a> won a match against team <a href="/team/{2}">{3}</a>.  Rub it on them!';        
        } else {
          desc = '<a href="/profile/{0}">{1}</a> lost a match to team <a href="/team/{2}">{3}</a>.  That has got to hurt!';        
        }
      } else {
        desc = '<a href="/profile/{0}">{1}</a> played a match against team <a href="/team/{2}">{3}</a> with unknown result';
      }

      desc = desc.replace('{0}', String(user._id))
                 .replace('{1}', user.nickname);
                 
      if (post.data && post.data.opponentid) {  // teamid exists, load team        
        
        loadTeam(post.data.opponentid, function(error, team) {
          if (team) {
            desc = desc.replace('{3}', team.teamname)
                      .replace('{2}', String(team._id));            
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


function loadPostComments(post, callback) {
  var utils = require('utils');
  
  if (post && post.comments) {
    utils.map(post.comments, loadFullComment, callback );
  } else {
    callback(null, post.comments);
  }
}


function loadFullComment(comment, callback) {
  
  if (comment && comment.posterid) {
    loadUser(comment.posterid, function(error, user) {
      if (user) {
        comment.pictureurl = user.pictureurl || '';
        var desc = '<a href="/profile/{0}">{1}</a> wrote: <div>{2}</div>';
        
        desc = desc.replace('{2}', comment.msg || '')
                  .replace('{0}', String(user._id))
                  .replace('{1}', user.nickname);
        comment.desc = desc;          
      }
      callback(error, comment);
    });
  } else {
    callback(null, comment);
  }
}


function loadTeam(teamid, callback) {
  var repo = require('../repository/teams');
  
  repo.getFullTeam(teamid, callback);
}


function loadUser(userid, callback) {
  var repo = require('../repository/users');
  
  repo.getFullUser(userid, callback);
}

function loadMatch(matchid, callback) {
  var repo = require('../repository/matches');
  
  repo.get(matchid, callback);
}

function matchtypetext(type) {
  switch (type) {
    case '1': 
      return 'one game match';
    case '3':
      return 'best of 3 games match';
    case '5':
      return 'best of 5 games match';      
    case '99':
      return 'a death match';
    default:
      return type;
  }
}
