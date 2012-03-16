newTeamRepo = require '../repository/teams2'
utils = require './utils'
userSvc = require './user'
matchSvc = require './match'


exports.getrecords = (teamid, callback = ->) ->
  console.assert teamid, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  try
    utils.execute( newTeamRepo.getById,  teamid )
    .then (err, hostteam, cb = ->) ->
      return callback(err) if err
      
      if hostteam?.records?.length
        utils.mapAsync hostteam?.records, (rec, iteratorcb = ->) ->
            rec?.result = if rec?.data?.result is 'win' then 'W' else 'L'
            rec?.teamid = rec?.data?.opponentid
            newTeamRepo.getById rec?.data?.opponentid, (getteamerr, team) ->
              rec?.teamname = team?.teamname
              iteratorcb getteamerr, rec
          , cb
      else
        cb()
    .then (err, recs, cb = ->) ->
      callback err, recs
      
  catch e
    console.trace e
    callback e  

###
###
exports.createJoinRequest = (teamid, playerid, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null'
  throw 'teamid cannot be null' unless teamid?
  console.assert playerid?, 'playerid cannot be null'
  throw 'playerid cannot be null' unless playerid?
  
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  findObj = 
    _id: teamid
  post =
    type: 'joinrequest'
    data:
      userid: playerid
    createdat: new Date()
  joinRequest =
    requestor: playerid
  updateObj = 
    $addToSet:
      joinrequests: joinRequest
      posts: post
    $set:
      updatedat: new Date()
  
  try
    newTeamRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    throw e

###
Add a match into a team
###
exports.addMatch = addMatch = (teamid, am, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null'
  throw 'teamid cannot be null' unless teamid?
  console.assert am?, 'am cannot be null'
  throw 'am cannot be null' unless am?

  am.status = 'pending'
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  
  findObj = 
    _id: teamid
  updateObj =
    $addToSet: 
      matches: am
    $set: 
      updatedat: new Date()
  
  try
    newTeamRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    throw e    


###
Retrieve an existing challenge 
###
exports.getChallenge = getChallenge = (teamid, opponentid, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null'
  throw 'teamid cannot be null' unless teamid?
  console.assert opponentid?, 'opponentid cannot be null'
  throw 'opponentid cannot be null' unless opponentid?
  
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  opponentid = new newTeamRepo.ObjectId(opponentid) if typeof opponentid is 'string'
  
  try
    newTeamRepo.read
      _id: teamid
      challenges: 
        '$elemMatch': 
          teamid: opponentid
    , {}, (err, cursor) ->
      return callback(err) if err
      cursor.toArray callback
  catch e
    console.trace e
    throw e    
    

###
Add a challenge obj in both teams, as well as the log for teams and players
###  
exports.createTeamChallenge = (params, callback = ->) ->
  console.assert params?, 'params cannot be null'
  throw 'params cannot be null' unless params?
    
  utils = require './utils'
  userSvc = require './user'
  
  {teamid, msg, matchtype} = params
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  opponentid = null
  
  try   
    utils.execute( userSvc.getById, params.opponentplayerid ) # get the opponent player obj
    .then (err, opponentplayer, cb = ->) =>
      # get the existing challenge
      return callback(err) if err    
      params.opponentid = opponentid = opponentplayer.team._id 
      
      try
        getChallenge teamid, opponentid, cb
      catch e
        console.trace e
        callback e
    .then (err, challenges, cb = ->) ->
      if challenges?.length
        # already challenged
        callback 'Already challenged'
      else
        cb()
    .then (args..., cb = ->) =>
      # create challenge for challenged team
      challenge =
        type: 'challenged'
        message: params.msg
        matchtype: params.matchtype
        teamid: opponentid
      
      findObj = _id : teamid
      challengePost = 
        type: 'challenged'
        data: challenge
        createdat: new Date()
      
      updateObj = 
        $addToSet:
          challenges: challenge
          posts: challengePost
        $set:
          updatedat: new Date()
      
      try
        newTeamRepo.update findObj, updateObj, {}, cb
      catch e
        console.trace e
        callback e
    .then (err, args..., cb = ->) ->
      # get challenged team
      try
        newTeamRepo.getById teamid, cb
      catch e
        console.trace e
        callback e
    .then (err, @challengedTeam, cb = ->) => 
      # create challenge post for members of challenged team
      for memberid in @challengedTeam?.members
        do (memberid) ->
          post = 
            type: 'teamchallenged'
            data: {teamid: opponentid, msg, matchtype }
            createdat: new Date()
          
          try  
            userSvc.addPost memberid, post
          catch e
            console.trace e
      cb()
    .then (args..., cb = ->) ->
      # create challenge for challenging team
      challenge = 
        type: 'challenging'
        message: msg
        matchtype: matchtype
        teamid: teamid
      
      findObj = _id : opponentid
      challengePost = 
        type: 'challenging'
        data: challenge
        createdat: new Date()
      
      updateObj = 
        $addToSet:
          challenges: challenge
          posts: challengePost
        $set:
          updatedat: new Date()
      try
        newTeamRepo.update findObj, updateObj, {}, cb
      catch e
        console.trace e
        callback e
    .then (err, args..., cb = ->) ->
      # get challenging team
      try
        newTeamRepo.getById opponentid, cb
      catch e
        console.trace e
        callback e
    .then (err, @challengingTeam, cb = ->) =>
      for memberid in @challengingTeam?.members
        do (memberid) ->
          post = 
            type: 'teamchallenging'
            data: {teamid, msg, matchtype }
            createdat: new Date()
          
          try  
            userSvc.addPost memberid, post
          catch e
            console.trace e
      cb()
    .then (args..., cb = ->) =>
      # email challenged team's members
      for memberid in @challengedTeam?.members
        do (memberid) =>
          post = 
            type: 'teamchallenged'
            teamid: opponentid
            teamname: @challengingTeam?.teamname
            msg: msg
            matchtype: matchtype
          
          try  
            userSvc.notifyChallenge memberid, post
          catch e
            console.trace e
      cb()
    .then ->
      callback()               
  catch e
    console.trace e
    throw e
  

###
Create a pending match, add it to both teams, remove the challenge
###
exports.acceptChallenge = (inputs, callback = ->) ->
  console.assert inputs?, 'inputs cannot be null'
  throw 'Inputs cannot be null' unless inputs?
  
  teamids = [inputs.challengingteamid, inputs.challengedteamid]
    
  try
    utils.execute( utils.mapAsync, teamids, newTeamRepo.getById )  # get all teams
    .then (err, @teams, cb = ->) =>
      # create match
      return callback(err) if err
      start = new Date()
      end = new Date()
      am = 
        start: start
        end: new Date(end.setDate( end.getDate() + 3 ))  # ends after 3 days
        status: 'pending'
        teams: teams
      try
        matchSvc.createMatch am, cb
      catch e
        console.trace e
        throw e
    .then (err, ams, cb = ->) =>
      @am = ams?[0]
      return callback(err) if err
      # add match to teams
      try
        utils.mapAsync @teams, (team, cb) => 
          addMatch( team._id, @am, cb )
        , cb
      catch e
        console.trace e
        throw e
    .then (err, args..., cb = ->) ->
      return callback(err) if err
      # remove the challenge from both teams
      try
        newTeamRepo.removeChallenge inputs.challengedteamid, inputs.challengingteamid
        newTeamRepo.removeChallenge inputs.challengingteamid, inputs.challengedteamid
      catch e
        console.trace e
        throw e
      cb()
    .then (err, args..., cb = ->) =>
      return callback(err) if err
      for team in @teams
        do (team) =>
          try
            utils.mapAsync team.members, (memberid, mapcb = ->) =>
              post = 
                type: 'newmatch'
                data: 
                  matchid: String(@am._id)
                createdat: new Date()
                
              try
                userSvc.addPost memberid, post, mapcb
              catch e
                console.trace e
                throw e
            , cb
          catch e
            console.trace e
            throw e
      callback()
  catch e
    console.trace e
    throw e

exports.cancelChallenge = (inputs, callback = ->) ->  
  console.assert inputs?, 'inputs cannot be null'
  throw 'Inputs cannot be null' unless inputs?

  try
    utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid)
    .then (err, others..., cb = ->) ->
      return callback(err) if err
      
      try
        newTeamRepo.getById inputs.challengingteamid, cb
      catch e
        console.trace e
        callback e
    .then (err, team, cb = ->) ->
      return callback(err) if err
      if Array.isArray(team?.members)
        for memberid in team.members
          do ( memberid ) ->
            post = 
              type: 'challengecancelling'
              data: 
                teamid: inputs.challengedteamid
                msg: 'Chicken dance'
              createdat: new Date()
            try
              userSvc.addPost memberid, post
            catch e
              console.trace e
      cb()
    .then (err, args..., cb = ->) ->  
      return callback(err) if err
      
      try
        newTeamRepo.removeChallenge inputs.challengedteamid, inputs.challengingteamid, cb
      catch e
        console.trace e
        callback e
    .then (err, others..., cb = ->) ->
      console.log 'Step 5', err
      return callback(err) if err
      
      try
        newTeamRepo.getById inputs.challengedteamid, cb
      catch e
        console.trace e
        callback e
    .then (err, team, cb = ->) ->
      return callback(err) if err
      if Array.isArray(team?.members)
        for memberid in team.members
          do (memberid) ->
            post = 
              type: 'challengecancelled'
              data: 
                teamid: inputs.challengingteamid
                msg: 'Chicken dance'
              createdat: new Date()
            
            try
              userSvc.addPost memberid, post
            catch e
              console.trace e
      callback()
  catch e
    console.trace e
    throw e
    

exports.declineChallenge = (inputs, callback = ->) ->  
  console.assert inputs?, 'inputs cannot be null'
  throw 'Inputs cannot be null' unless inputs?

  try
    utils.execute(newTeamRepo.removeChallenge, inputs.challengingteamid, inputs.challengedteamid)
    .then (err, others..., cb = ->) ->
      return callback(err) if err
      
      try
        newTeamRepo.getById inputs.challengingteamid, cb
      catch e
        console.trace e
        callback e
    .then (err, team, cb = ->) ->
      return callback(err) if err
      if Array.isArray(team?.members)
        for memberid in team.members
          do ( memberid ) ->
            post = 
              type: 'challengedeclined'
              data: 
                teamid: inputs.challengedteamid
                msg: 'Chicken dance'
              createdat: new Date()
              
            try
              userSvc.addPost memberid, post
            catch e
              console.trace e
      cb()
    .then (err, args..., cb = ->) ->   
      return callback(err) if err
      
      try
        newTeamRepo.removeChallenge inputs.challengedteamid, inputs.challengingteamid, cb
      catch e
        console.trace e
        callback e
    .then (err, others..., cb = ->) ->
      return callback(err) if err
      
      try
        newTeamRepo.getById inputs.challengedteamid, cb
      catch e
        console.trace e
        callback e
    .then (err, team, cb = ->) ->
      return callback(err) if err
      if Array.isArray(team?.members)
        for memberid in team.members
          do (memberid) ->
            post = 
              type: 'challengedeclining'
              data: 
                teamid: inputs.challengingteamid
                msg: 'Chicken dance'
              createdat: new Date()
              
            try
              userSvc.addPost memberid, post
            catch e
              console.trace e
      callback()
  catch e
    console.trace e
    throw e
    
      
exports.cancelMatch = (teamid, matchid, callback = ->) ->
  return callback() unless teamid? and teamid isnt 'undefined' and matchid? and matchid isnt 'undefined'
  
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  matchid = new newTeamRepo.ObjectId(matchid) if typeof matchid is 'string'
  
  findObj = 
    _id: teamid
  updateObj =
    $pull: 
      matches: 
        _id: matchid
    $set: 
      updatedat: new Date()
  
  try
    newTeamRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e  
  

exports.resetStats = (teamid, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  teamid = new newTeamRepo.ObjectId( teamid ) if typeof teamid is 'string'
  findObj = _id : teamid
  updateObj = 
    $unset: 
      stats: 1
      records: 1
    
  try
    newTeamRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    throw e 
  
  
exports.updateStats = (teamid, opponentid, win, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  teamid = new newTeamRepo.ObjectId( teamid ) if typeof teamid is 'string'
  opponentid = String opponentid if typeof opponentid isnt 'string'
  findObj = _id : teamid
  incObj = if win then {'stats.win':1} else {'stats.loss': 1}
  statLog = 
    id: new newTeamRepo.ObjectId()
    type: 'matchresult'
    data: 
      opponentid: opponentid
      result: if win then 'win' else 'lose'
    createdat: new Date()
  updateObj = 
    $inc: incObj
    $set: 
      updatedat: new Date()
    $addToSet: 
      posts: statLog
      records: statLog
    
  try
    newTeamRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    throw e
    
    
exports.updateStatsSilent = (teamid, opponentid, win, callback = ->) ->
  console.assert teamid?, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  teamid = new newTeamRepo.ObjectId( teamid ) if typeof teamid is 'string'
  opponentid = String opponentid if typeof opponentid isnt 'string'
  findObj = _id : teamid
  incObj = if win then {'stats.win':1} else {'stats.loss': 1}
  statLog = 
    id: new newTeamRepo.ObjectId()
    type: 'matchresult'
    data: 
      opponentid: opponentid
      result: if win then 'win' else 'lose'
    createdat: new Date()
  updateObj = 
    $inc: incObj
    $addToSet: 
      records: statLog
    
  try
    newTeamRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    throw e            
  
  
exports.setMatchComplete = (teamid, am, callback = ->) ->
  return callback() unless teamid? and teamid isnt 'undefined' and am? and am isnt 'undefined'
  
  teamid = new newTeamRepo.ObjectId(teamid) if typeof teamid is 'string'
  matchid = am._id
  
  findObj = 
    _id: teamid
  updateObj =
    $addToSet: 
      completematches: am
    $pull: 
      matches:  
        _id: matchid
    $set: 
      updatedat: new Date()
  
  try
    newTeamRepo.update findObj, updateObj, {}, callback  
    #callback()
  catch e
    console.trace e
    throw e 
  
  
  
  
exports.sortingTeams = (team1, team2) ->
  win1 = team1?.stats?.win ? 0
  loss1 = team1?.stats?.loss ? 0
  total1 = win1 + loss1
  avg1 = if total1 then (win1 / total1) else 0
  win2 = team2?.stats?.win ? 0
  loss2 = team2?.stats?.loss ? 0
  total2 = win2 + loss2
  avg2 = if total2 then (win2 / total2) else 0
    
  if avg1 isnt avg2
    -avg1 + avg2
  else if win1 isnt win2
    -win1 + win2
  else
    loss1 - loss2



exports.getAll = (availableOnly, callback = ->) -> 
  query = 
    hidden: 
      $ne: 1
  
  if availableOnly
    query.$or = [{members: null}, {members: {$size: 0}}, {members: {$size: 1}}]
  try
    newTeamRepo.read query, (readErr, cursor) ->
      if readErr?
        callback readErr
      else if cursor?
        cursor.toArray callback
      else
        callback()
        
  catch e
    console.trace e
    throw e


exports.getById = (teamid, callback = ->) -> 
  console.assert teamid, 'TeamId cannot be null or 0'
  throw 'TeamId cannot be null or 0' unless teamid
  
  newTeamRepo.getById teamid, callback
  
  
exports.create = (team, args..., callback = ->) ->
  team = teamname : team if typeof team is 'string'
  
  try
    newTeamRepo.create team, callback
  catch e
    console.trace e
    throw e
  
  
    
    
    
    
