userSvc = require './services/user'
teamSvc = require './services/team'
matchSvc = require './services/match'
utils = require './services/utils'


updateMatchScore = (m, callback = ->) ->
  matchSvc.finalize m, callback
  
  
removeMatch = (m, callback = ->) ->
  matchSvc.cancel m, callback
  
  
processMatch = (m) ->
  return unless m?
  console.log m.status, m.start, m.end, m.votes?.length
  
  if m?.votes?.length  # update match score
    console.log 'update match score in here'
    updateMatchScore m
  else # no vote, remove match!
    removeMatch m
    
  
try
  console.time 'Getting pending matches'
  matchSvc.getPendingExpiredMatches (error, matches) ->
    console.timeEnd 'Getting pending matches'
    console.log 'Error %s', error if error    
    processMatch m for m in matches if matches?  
catch e
  console.log e
