matchSvc = require './services/match'
teamSvc = require './services/team'
userSvc = require './services/user'
utils = require './services/utils'


updateMatchScore = (m, callback = ->) ->
  matchSvc.finalizeSilent m, callback
  
  
removeMatch = (m, callback = ->) ->
  matchSvc.cancel m, callback
  
  
processMatch = (m) ->
  return unless m?
  console.log m.status, m.start, m.end, m.votes?.length
  
  if m?.votes?.length  # update match score
    updateMatchScore m
    
  
try
  utils.seriesAsync [
    (val, cb = ->) ->
      console.time 'Getting all players'
      userSvc.getAllPlayers (err, players) -> 
        console.timeEnd 'Getting all players'    
        if players?
          utils.mapAsync players, (player, iteratorCb) ->
              console.time "Reset player #{player._id} stats"
              userSvc.resetStats player._id, ->
                console.timeEnd "Reset player #{player._id} stats"
                iteratorCb.apply null, arguments
            , cb       
    (val, cb = ->) ->    
      console.time 'Getting all teams'
      teamSvc.getAll false, (err, teams) -> 
        console.timeEnd 'Getting all teams'    
        if teams?
          utils.mapAsync teams, (team, iteratorCb) ->
              console.time "Reset team #{team._id} stats"
              teamSvc.resetStats team._id, ->
                console.timeEnd "Reset team #{team._id} stats"
                iteratorCb.apply null, arguments
            , cb       
            
    (val, cb = ->) ->  
      console.time 'Getting complete matches'
      matchSvc.getCompleteMatches (error, matches) ->
        console.timeEnd 'Getting complete matches'
        console.log 'Error %s', error if error    
        processMatch m for m in matches if matches?
        cb()  
  ], null, (err, result) ->
    console.log err
    console.log 'DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE DONE  '
catch e
  console.log e
