userSvc = require './services/user'
teamSvc = require './services/team'
matchSvc = require './services/match'


updateMatchScore = (m) ->
  console.log 'Counting votes'  
  return unless m?.teams?.length is 2
  
  results = {}
  # initialize the result object
  results[String(m.teams[0]._id)] = 
    count: 0
    opponentid: String(m.teams[1]._id)
  results[String(m.teams[1]._id)] = 
    count: 0
    opponentid: String(m.teams[0]._id)
  
  for {teamid, count} in m.votes
    results[teamid].count += count
  
  console.log 'Result '
  console.log 'team %s count=%n', teamid, result.count for teamid, result in results
  
  console.time 'Set match status to complete'
  matchSvc.setStatus String(m._id), 'complete', (err) ->
    console.timeEnd 'Set match status to complete'
    console.log 'Set match status to complete with err %s', err
  for teamid, result in results
    console.time "Team #{teamid} update stats"
    teamSvc.updateStats teamid, result.opponentid, result.count > 0, (err) ->
      console.timeEnd "Team #{teamid} update stats"
      console.log "Team #{teamid} update stats with error #{err}" if err
    console.time "Players of team #{teamid} update stats"
    userSvc.updateStats teamid, result.opponentid, result.count > 0, (err) ->
      console.timeEnd "Players of team #{teamid} update stats"
      console.log "Players of team #{teamid} update stats with error #{err}" if err
      
  setMatchComplete = (teamid, matchid) ->
    console.time "Set team #{teamid} match complete"
    teamSvc.setMatchComplete teamid, matchid, (err) ->
      console.timeEnd "Set team #{teamid} match complete"
      console.log "Set team #{teamid} match complete with error #{err}" if err
    
  setMatchComplete team._id, m._id for team in m.teams
  
  
processMatch = (m) ->
  return unless m?
  console.log m.status, m.start, m.votes?.length
  
  if (not m.votes?) or (not m.votes.length)  # no vote, remove match!
    console.time 'Cancelling match for team'
    rm_cb = (err) -> 
      console.timeEnd 'Cancelling match for team' 
      console.log 'Cancelling match for team with error %s', err if err
    teamSvc.cancelMatch String(team._id), String(m._id), rm_cb for team in m.teams
    
    console.time 'Cancelling match'
    matchSvc.setStatus m._id, 'Cancelled', (err) ->
      console.timeEnd 'Cancelling match'
      console.log 'Cancelling match err %s', err if err
      
  else  # update match score
    updateMatchScore m

try
  console.time 'Getting pending matches'
  matchSvc.getPendingExpiredMatches (error, matches) ->
    console.timeEnd 'Getting pending matches'
    console.log 'Error %s', error if error
    
    processMatch m for m in matches if matches?  
catch e
  console.log e
