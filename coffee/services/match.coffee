matchRepo = require('../repository/matches2')


exports.getCompleteMatches = (callback = ->) ->
  query =
    status: 'complete'
  try
    matchRepo.read query, (readErr, cursor) ->
      if readErr?
        callback readErr
      else if cursor?
        cursor.toArray callback
      else
        callback()
        
  catch e
    console.log e
    throw e
      

exports.getPendingExpiredMatches = (callback) ->
  query = 
    status: 'pending'
    end:
      $lt: new Date()
  
  try
    matchRepo.read query, (readErr, cursor) ->
      if readErr?
        callback readErr
      else if cursor?
        cursor.toArray callback
      else
        callback()
        
  catch e
    console.log e
    throw e
    
exports.setStatus = setStatus = (matchid, status, callback = ->) ->
  console.assert matchid, 'matchid cannot be null or 0'  
  throw 'matchid is null or empty' unless matchid?

  matchid = new matchRepo.ObjectId( matchid ) if typeof matchid is 'string'
  findObj = _id : matchid
  updateObj = 
    $set: 
      status: status
      updatedat: new Date()
  
  try
    matchRepo.update findObj, updateObj, callback  
  catch e
    console.trace e
    callback e
    
    
exports.cancel = (am, callback = ->) ->
  utils = require './utils'
  teamSvc = require './team'
  playerSvc = require './user'
  
  makeSetMatchStatus = (status) ->
    (m, cb) ->
      console.time 'Cancelling match id=%s', m._id
      setStatus m._id, status, () ->
        console.timeEnd 'Cancelling match id=%s', m._id
        cb.apply @, arguments
        
      
  makeRemoveTeamsMatch = (teams) ->
    (m, cb = ->) ->
      makeRemoveOneTeamMatch = (m) ->
        (team, cb2 = ->) ->
          console.time 'Removing match from team id=%s', team._id
          teamSvc.cancelMatch team._id, m, () ->
            console.timeEnd 'Removing match from team id=%s', team._id
            cb2.apply @, arguments
      
      console.timeEnd 'Removing match from teams'
      utils.mapAsync teams, makeRemoveOneTeamMatch( m ), () ->
        console.timeEnd 'Removing match from teams'
        cb.apply @, arguments
      
  makeCreatePlayersPost = (teams) ->
    players = []
    for team in teams
      do (team) ->
        players = players.concat team.members
    (m, cb = ->) ->
      makeCreateOnePlayerPost = (m) ->
        (playerid, cb2 = ->) ->
          post = 
            type: 'matchcancelled'
            data: 
              matchid: String(m._id)
            createdat: new Date()
          
          console.time 'Creating post for player id=%s', playerid
          playerSvc.addPost playerid, post, () ->
            console.timeEnd 'Creating post for player id=%s', playerid
            cb2.apply @, arguments
          
      console.time 'Creating post for players'  
      utils.mapAsync players, makeCreateOnePlayerPost(m), () ->
        console.timeEnd 'Creating post for players'
        cb.apply @, arguments
      
  console.time 'Match cancelling'
  utils.seriesAsync [makeSetMatchStatus('cancelled'), makeRemoveTeamsMatch(am.teams), makeCreatePlayersPost(am.teams)], am, (err, result) ->
    console.timeEnd 'Match cancelling'
    callback.apply @, arguments
    
                            
exports.finalize = (am, callback = -> ) ->
  teamSvc = require './team'
  playerSvc = require './user'  
  utils = require './utils'
  
  console.log 'Counting votes'  
  return unless am?.teams?.length is 2
  
  results = {}
  # initialize the result object
  results[String(am.teams[0]._id)] = 
    count: 0
    win: false
    opponentid: String(am.teams[1]._id)
  results[String(am.teams[1]._id)] = 
    count: 0
    win: false
    opponentid: String(am.teams[0]._id)
  
  for {teamid, count} in am.votes
    results[teamid].count += count
    
  maxCount = Math.max results[String(am.teams[1]._id)].count, results[String(am.teams[0]._id)].count
  
  results[String(am.teams[1]._id)].win = maxCount <= results[String(am.teams[1]._id)].count
  results[String(am.teams[0]._id)].win = maxCount <= results[String(am.teams[0]._id)].count
  
  console.log 'Result '
  for teamid, result of results
    do (teamid, result) ->
      console.log 'team %s count=%d win=%s', teamid, result.count, result.win 
  
  
  makeSetMatchComplete = () ->
    (m, cb = ->) ->
      console.time "Set match #{m._id} status to complete"
      setStatus m._id, 'complete', (err) ->
        console.timeEnd "Set match #{m._id} status to complete"
        console.log 'Set match status to complete with err %s', err?
        cb.apply @, arguments
    
  makeUpdateTeamStats = () ->
    (m, cb = ->) ->
      for teamid, result of results
        do (teamid, result) ->
          console.time "Team #{teamid} update stats"
          teamSvc.updateStats teamid, result.opponentid, result.win, (err) ->
            console.timeEnd "Team #{teamid} update stats"
            console.log "Team #{teamid} update stats with error #{err}" if err?
            cb.apply @, arguments
            
  makeUpdatePlayerStats = () ->
    players = []
    for team in am.teams
      do (team) ->
        players = players.concat team.members
    console.log 'Player Ids = ', players
        
    makeUpdatePlayerStats = ( teamidByplayerIdFn ) ->
      (playerid, cb2 = ->) ->
        result = results[teamidByplayerIdFn(playerid)]
        console.log "Found result #{result} for player #{playerid}"
        console.time "Updating player #{playerid} stats"
        playerSvc.updateStats playerid, result.opponentid, result.win, () ->
          console.timeEnd "Updating player #{playerid} stats"
          cb2.apply @, arguments
      
    (m, cb = ->) ->
      fn = (playerid) -> 
        ids = team._id for team in am.teams when team.members.indexOf(playerid) >= 0
        console.log "Found team #{ids} for player #{playerid}"
        String ids
        
      console.time 'Updating players stats'
      utils.mapAsync players, makeUpdatePlayerStats( fn ), () ->
        console.timeEnd 'Updating players stats'
        cb.apply @, arguments
      
  makeSetTeamMatchComplete = () ->
    (m, cb = ->) ->
      for team in am.teams
        do (team) ->
          console.time "Match #{am._id} Set team #{team._id} match complete"
          teamSvc.setMatchComplete team._id, am, (err) ->
            console.timeEnd "Match #{am._id} Set team #{team._id} match complete"
            console.log "Match #{am._id} Set team #{team._id} match complete with error #{err}" if err?
      cb null
  
  utils.seriesAsync [makeSetMatchComplete(), makeUpdateTeamStats(), makeUpdatePlayerStats(), makeSetTeamMatchComplete()], am, () ->
    console.log 'Done!'
    
    
###
Finalize a match, silently
###    
exports.finalizeSilent = (am, callback = -> ) ->
  teamSvc = require './team'
  playerSvc = require './user'  
  utils = require './utils'
  
  console.log 'Counting votes'  
  return unless am?.teams?.length is 2
  
  results = {}
  # initialize the result object
  results[String(am.teams[0]._id)] = 
    count: 0
    win: false
    opponentid: String(am.teams[1]._id)
  results[String(am.teams[1]._id)] = 
    count: 0
    win: false
    opponentid: String(am.teams[0]._id)
  
  for {teamid, count} in am.votes
    results[teamid].count += count
    
  maxCount = Math.max results[String(am.teams[1]._id)].count, results[String(am.teams[0]._id)].count
  
  results[String(am.teams[1]._id)].win = maxCount <= results[String(am.teams[1]._id)].count
  results[String(am.teams[0]._id)].win = maxCount <= results[String(am.teams[0]._id)].count
  
  console.log 'Result '
  for teamid, result of results
    do (teamid, result) ->
      console.log 'team %s count=%d win=%s', teamid, result.count, result.win 
  
  
  makeSetMatchComplete = () ->
    (m, cb = ->) ->
      console.time "Set match #{m._id} status to complete"
      setStatus m._id, 'complete', (err) ->
        console.timeEnd "Set match #{m._id} status to complete"
        console.log 'Set match status to complete with err %s', err?
        cb.apply @, arguments
    
  makeUpdateTeamStats = () ->
    (m, cb = ->) ->
      for teamid, result of results
        do (teamid, result) ->
          console.time "Team #{teamid} update stats"
          teamSvc.updateStatsSilent teamid, result.opponentid, result.win, (err) ->
            console.timeEnd "Team #{teamid} update stats"
            console.log "Team #{teamid} update stats with error #{err}" if err?
            cb.apply @, arguments
            
  makeUpdatePlayerStats = () ->
    players = []
    for team in am.teams
      do (team) ->
        players = players.concat team.members
    console.log 'Player Ids = ', players
        
    makeUpdatePlayerStats = ( teamidByplayerIdFn ) ->
      (playerid, cb2 = ->) ->
        result = results[teamidByplayerIdFn(playerid)]
        console.log "Found result #{result} for player #{playerid}"
        console.time "Updating player #{playerid} stats"
        playerSvc.updateStatsSilent playerid, result.opponentid, result.win, () ->
          console.timeEnd "Updating player #{playerid} stats"
          cb2.apply @, arguments
      
    (m, cb = ->) ->
      fn = (playerid) -> 
        ids = team._id for team in am.teams when team.members.indexOf(playerid) >= 0
        console.log "Found team #{ids} for player #{playerid}"
        String ids
        
      console.time 'Updating players stats'
      utils.mapAsync players, makeUpdatePlayerStats( fn ), () ->
        console.timeEnd 'Updating players stats'
        cb.apply @, arguments
      
  makeSetTeamMatchComplete = () ->
    (m, cb = ->) ->
      for team in am.teams
        do (team) ->
          console.time "Match #{am._id} Set team #{team._id} match complete"
          teamSvc.setMatchComplete team._id, am, (err) ->
            console.timeEnd "Match #{am._id} Set team #{team._id} match complete"
            console.log "Match #{am._id} Set team #{team._id} match complete with error #{err}" if err?
      cb null
  
  utils.seriesAsync [makeSetMatchComplete(), makeUpdateTeamStats(), makeUpdatePlayerStats(), makeSetTeamMatchComplete()], am, () ->
    console.log 'Done!'    
  
  
  
  
  
  
  
