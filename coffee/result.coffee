userSvc = require './services/user'
teamSvc = require './services/team'
matchSvc = require './services/match'

processMatch = (m) ->
  return unless m?
  console.log m.status, m.start, m.votes?.length

try
  console.time 'Getting pending matches'
  matchSvc.getPendingExpiredMatches (error, matches) ->
    console.timeEnd 'Getting pending matches'
    console.log 'Error %s', error if error
    
    processMatch m for m in matches if matches?
  
catch e
  console.log e
