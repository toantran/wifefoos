

exports.update = function(req, res, next) {
  var matchid = req.params.id
    , teamid = req.param('teamid')
    , playerid = req.param('playerid')
    , result = req.param('result');
    
  if (!matchid || !teamid || !playerid || !result) {
    res.send({
      success: false
      , error: 'Ids empty'
    });
    
    return;
  }
  
  if (result !== 'win' && result !== 'lose') {
    res.send({
      success: false
      , error: 'Invalid result'
    });
    
    return;
  }
  
  vote({
    matchid: matchid
    , teamid: teamid
    , playerid: playerid
    , result: result
  }, function(error) {
    if (error) {
      res.send({
        success: false
        , error: error
      });
    } else {
      res.send({
        success: true
      });
    }
  });
}


function vote(inputs, callback) {
  callback = callback || function() {};
  
  if (!inputs) { 
    callback('Inputs empty'); 
    return false;
  }
  
  var matchRepo = require('../repository/matches')
    , utils = require('utils')
    , voteObj = {
      playerid: inputs.playerid
      , teamid: inputs.teamid
      , count: inputs.result === 'win' ? 1 : -1
    };
  
  
  matchRepo.addVote(inputs.matchid, voteObj, function( error, am) {
    if (error) {
      callback(error);
      return false;
    }
    
    // add this vote to player's profile
    addVoteToPlayer(inputs, function(error, player) {
      callback(error, player);
      return;
    });   
    
    if (am && am.teams && (am.teams.length === 2) && am.votes) {
      
      var voteCount = am.votes.length
        , memberCount = 0
        , results = {};
      
      am.teams.forEach( function(team, index, teams) {
        memberCount += team.members ? team.members.length : 0;
        
        // initialize the result object for later
        results[String(team._id)] = {
          count: 0
          , opponentid: String(teams[(index + 1) % 2]._id)
        };
      });
      
      if (voteCount >= memberCount) {  // full votes
        // set match status complete
        matchRepo.setStatus(inputs.matchid, 'complete');
        
        // calculate result
        am.votes.forEach( function(item) {
          if (item && item.teamid) {
            results[item.teamid].count += item.count;
          }
        });
        
        // set stats for teams and players
        for(teamid in results) {
          var win = results[teamid].count >= 0;
          
          updateStats(teamid, results[teamid], win);
        }

        // move teams' match to complete match collection
        setTeamMatchComplete(am);
      }
    }
  });
}


function updateStats(teamid, data, win, callback) {
  var teamRepo = require('../repository/teams')
    , userRepo = require('../repository/users')
    , count = 2
    , fn = function(error, result) {
      count--;
      
      if (count <= 0) {
        callback();
      }
    };
  
  callback = callback || function() {};
    
  if (teamid) {  
    teamRepo.updateStats(teamid, data.opponentid, win, fn);
    userRepo.updateStats(teamid, data.opponentid, win, fn);
  } else {
    callback();
  }
  
  return true;
}


function setTeamMatchComplete(am, callback) {
  var teamRepo = require('../repository/teams')
    , count = 0;
  
  callback = callback || function() {};
    
  if (am && am.teams && am.teams.length) {
    count = am.teams.length;
    
    am.teams.forEach( function(team) {
      teamRepo.completeMatch(String(team._id), am, function() {
        count--;
        if (count <= 0) {
          callback(arguments);
        }
      });    
    });
    
  } else {
    callback();
  }
  
  return true;
}


function addVoteToPlayer(inputs, callback) {
  var userRepo = require('../repository/users')
    , vote = {
      teamid: inputs.teamid
      , matchid: inputs.matchid
      , result: inputs.result
    }
    , playerid= inputs.playerid;
  
  callback = callback || function() {};
  
  userRepo.addVote(playerid, vote, callback);
  
  return true;
}







