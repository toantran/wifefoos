

/*
  GET
  URL: /player
  Return a list of all players
*/
exports.index = function (req, res, next) {
  getAllPlayers( function(err, players) {
    
    console.log(err, players);
    
    if (err) {
      req.flash('error', err);
    }
    
    res.render(players, {
      layout: true
      , title: 'Wheels Foosball League (WFL) - Players'
    });
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


function getAllPlayers( callback ) {
  var repo = require('../repository/users');
  
  repo.getAllUsers( callback );
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




