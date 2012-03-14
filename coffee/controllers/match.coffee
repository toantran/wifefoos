
exports.update = (req, res, next) ->
  matchid = req.params.id
  teamid = req.param 'teamid', ''
  playerid = req.param 'playerid', ''
  result = req.param 'result', ''
  callback = (err) ->
    res.send 
      success: false
      error: err

  if not matchid or not teamid or not playerid or not result
    res.send
      success: false
      error: 'Ids empty'
  else if result isnt 'win' and result isnt 'lose'
    res.send
      success: false
      error: 'Invalid result'
  else    
    matchsvc = require '../services/match'
    utils = require '../services/utils'
    
    utils.execute( matchsvc.addVote, matchid, playerid, teamid, result )
    .then (err, args..., cb = ->) ->
      return callback(err) if err
      
      matchsvc.getById matchid, cb
    .then (err, @am, cb = -> ) =>
      return callback(err) if err
      return callback('match not found') if not @am?
      
      @totalplayers = @am?.teams?.map( (team) -> team?.members?.length ? 0 ).reduce( (prev, curr) -> 
        prev + curr
      , 0 )
      @totalvotes = @am?.votes?.length ? 0
      @totalDecisions = matchsvc.countDecisions @am
      if @totalvotes >= @totalplayers or @totalDecisions > @totalplayers / 2
        matchsvc.finalize @am, cb
      res.send
        success: true
    .then (err) =>
      console.log err    






