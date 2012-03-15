crypto = require 'crypto'
newUserRepo = require '../repository/users2'
teamRepo = require '../repository/teams2'
utils = require './utils'

hash = (msg, key) ->
  crypto.createHmac( 'sha256', key)
  .update(msg)
  .digest('hex')

loadChallenge = (challenge, callback) ->
  return callback() unless challenge?
  # load opponent team
  if challenge.teamid?
    teamRepo.getSimpleTeam String(challenge.teamid), (err, team) ->
      challenge.teamname = team?.teamname ? 'Unknown'
      callback null, challenge
  else
    callback null, challenge

# load challenge with opponent team name
loadChallenges = (challenges, callback) ->
  return callback(null, challenges) unless challenges? and challenges.length isnt 0
  utils.map challenges, loadChallenge, callback

# load match with team name
loadMatch = (hometeamid, m, callback) ->  
  if m?.teams?.length isnt 0
    for team in m.teams 
      if team?._id.equals( hometeamid )
        m.opponentteamid = team._id
        m.opponentteamname = team.teamname
  callback null, m
  
# load all matches with team name
loadMatches = (hometeamid, matches, callback) ->
  return callback(null, matches) unless matches? and matches.length isnt 0
  utils.map matches, (m, cb) ->
    loadMatch hometeamid, m, cb
  , callback


###
Load user's team with active matches and active challenges
###
loadUserTeam = (teamid, callback) ->
  return callback() unless teamid? and teamid isnt 'undefined'
  
  teamRepo.getFullTeam String(teamid), (err, team) ->
    return callback( err ) if err? or not team?
    # load full challenge list
    __loadChallengesFn = (lc_cb) ->
      loadChallenges team.challenges, (lc_err, challenges) ->
        team.challenges = challenges unless lc_err?
        lc_cb err, challenges
    # load full match list
    __loadMatchesFn = (lm_cb) ->
      loadMatches team._id, team.matches, (lm_err, matches) ->
        team.matches = matches.filter( (am) -> am.end >= new Date() ) unless lm_err?
        lm_cb err,matches
        
    utils.parallel [__loadChallengesFn, __loadMatchesFn], (parallel_err, results) ->
      callback err, team


###
Authenticate a user login
###
exports.authenticate = (username, password, callback) ->
  console.assert username, 'username cannot be null or empty'
  throw 'username is null or empty' unless username?
  
  encryptedPassword = hash password, 'a little dog'
  newUserRepo.getByUsername username, (error, user) ->
    if error
      callback error
    else if not user?
      callback 'User not found'
    else if encryptedPassword is user.password
      callback null, true, user
    else 
      callback null, false
        


###
LOAD a user document with all neccessary properties re-populated in the root object
###        
exports.loadMobileUser = (userid, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  try
    newUserRepo.getById userid, (error, user) ->
      if error
        callback error
      else if user
        # populate property wins
        user.wins = user.stats?.win ? 0
        # populate property losses
        user.losses = user.stats?.loss ? 0
        # populate challenge count, match count
        try
          loadUserTeam user.team?._id, (err, team) ->
            user.challenges = team?.challenges
            user.challengeCount = team?.challenges?.length || 0
            user.matches = team?.matches
            console.dir user.matches
            user.matchCount = team?.matches?.length || 0
            callback null, user
        catch loadUserTeamEx
          console.trace loadUserTeamEx
          callback loadUserTeamEx 
      else
        callback null, user
  catch e
    console.trace e
    callback e
    

###
LOAD a user document by Id
###
exports.getById = (userid, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  try
    newUserRepo.getById userid, callback
  catch e
    console.trace e
    callback e  
  

###
Update player's stats
###
exports.resetStats = (userid, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  findObj = _id : userid
  updateObj = 
    $unset: 
      stats: 1
      records: 1
    
  try
    newUserRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    callback e
    
    
###
Update player's stats
###
exports.updateStats = (userid, opponentid, win, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  opponentid = String opponentid if typeof opponentid isnt 'string'
  findObj = _id : userid
  incObj = if win then {'stats.win':1} else {'stats.loss': 1}
  statLog = 
    id: new newUserRepo.ObjectId()
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
    newUserRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    callback e
  

###
Update player's stats.  Silently
###
exports.updateStatsSilent = (userid, opponentid, win, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  opponentid = String opponentid if typeof opponentid isnt 'string'
  findObj = _id : userid
  incObj = if win then {'stats.win':1} else {'stats.loss': 1}
  statLog = 
    id: new newUserRepo.ObjectId()
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
    newUserRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    callback e

  
  
###
Update player's picture
###
exports.updatePicture = (userid, pictureurl, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?

  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  findObj = _id : userid
  updateObj = 
    $set: 
      pictureurl: pictureurl
      updatedat: new Date()
  
  try
    newUserRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e
    
    

###
Add a vote record into player's record
###
exports.addVote = (userid, vote, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  findObj = _id : userid
  logObj = 
    type: 'matchresult'
    data: 
      matchid: vote.matchid
      teamid: vote.teamid
    createdat: new Date()
  updateObj = 
    $set: 
      updatedat: new Date()
    $addToSet:
      votes: vote
      logs: logObj
  
  try
    newUserRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e
        

###
Set a team to a player
###    
exports.setTeam = (userid, team, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  findObj = _id : userid
  post =
    id: new newUserRepo.ObjectId() 
    type: 'jointeam'
    data: 
      teamid: String(team._id)
    createdat: new Date()
  updateObj = 
    $set: 
      team: team
      updatedat: new Date()
    $unset:
      invites: 1
    $addToSet:
      posts: post  
  
  try
    newUserRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e
        

###
Add a post record into player's record
###            
exports.addPost = (userid, post, callback= ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  
  findObj = _id : userid
  post or= {}
  post.createdat = new Date()
  post.id = new newUserRepo.ObjectId()
  updateObj = 
    $set: 
      updatedat: new Date()
    $addToSet:
      posts: post    
  
  try
    newUserRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e
    

###
Remove a post from player's record
###    
exports.removePost = (userid, postid, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  console.assert postid, 'postid cannot be null or 0'  
  throw 'postid is null or empty' unless postid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  postid = new newUserRepo.ObjectId( postid ) if typeof postid is 'string'
  findObj = _id : userid
  updateObj = 
    $set: 
      updatedat: new Date()
    $pull: 
      posts: 
        id: postid
  
  try
    newUserRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e
    

###
Add a comment record into player's record
###    
exports.addComment = (userid, postid, data, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  console.assert postid, 'postid cannot be null or 0'  
  throw 'postid is null or empty' unless postid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  postid = new newUserRepo.ObjectId( postid ) if typeof postid is 'string'
  
  data or= {}
  data.id = new newUserRepo.ObjectId()
  data.createdat = new Date()
  
  findObj = _id : userid  
  
  try
    newUserRepo.getById userid, (getErr, user) ->
      return callback( getErr ) if getErr?
      for post in user?.posts when post?.id?.equals( postid )
        do (post) ->
          post.comments or= []
          post.comments.push data     
          updateObj = 
            $set:
              posts: user?.posts
              updatedat: new Date()
          newUserRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    callback e


###
Remove a comment
###
exports.removeComment = (userid, postid, commentid, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  console.assert postid, 'postid cannot be null or 0'  
  throw 'postid is null or empty' unless postid?
  console.assert commentid, 'commentid cannot be null or 0'  
  throw 'commentid is null or empty' unless commentid?

  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  postid = new newUserRepo.ObjectId( postid ) if typeof postid is 'string'
  commentid = new newUserRepo.ObjectId( commentid ) if typeof commentid is 'string'
  
  findObj = _id : userid
  
  try
    newUserRepo.getById userid, (getErr, user) ->
      return callback( getErr ) if getErr?
      for post in user?.posts when post?.id?.equals( postid )
        do (post) ->
          for comment, index in post?.comments
            do (comment, index) ->
              if comment?.id?.equals(commentid)
                post?.comments.splice index, 1
          updateObj = 
            $set:
              posts: user?.posts
              updatedat: new Date()
          newUserRepo.update findObj, updateObj, {}, callback
  catch e
    console.trace e
    callback e

###
Add a vote record into player's record
###        
exports.addTeamInvite = (userid, teamid, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  console.assert teamid, 'teamid cannot be null or 0'  
  throw 'teamid is null or empty' unless teamid?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  teamid = new newUserRepo.ObjectId( teamid ) if typeof teamid is 'string'
  
  findObj = _id : userid
  invite = 
    teamid: teamid
  invitedPost = 
    id: new newUserRepo.ObjectId()
    type: 'invite'
    data: 
      teamid: teamid
    createdat: new Date()
  updateObj = 
    $set: 
      updatedat: new Date()
    $addToSet:
      invites: invite
      posts: invitedPost  
  
  try
    newUserRepo.update findObj, updateObj, {}, callback       
  catch e
    console.trace e
    callback e
  
  
exports.sortingPlayers = (player1, player2) ->
  win1 = player1?.stats?.win ? 0
  loss1 = player1?.stats?.loss ? 0
  total1 = win1 + loss1
  avg1 = if total1 then (win1 / total1) else 0
  win2 = player2?.stats?.win ? 0
  loss2 = player2?.stats?.loss ? 0
  total2 = win2 + loss2
  avg2 = if total2 then (win2 / total2) else 0
    
  if avg1 isnt avg2
    -avg1 + avg2
  else if win1 isnt win2
    -win1 + win2
  else
    loss1 - loss2
    
    
exports.insert = (user, callback = ->) ->
  console.assert user, 'user cannot be null'  
  throw 'user cannot be null' unless user?
  
  utils.execute(newUserRepo.getByUsername, user.username)
  .then (err, existingUser, cb) ->
    if err?
      callback err
    else if existingUser?
      callback 'You Chose an Email Address That is Already Registered, You Hacker!'
    else
      user.createdat = new Date()
      user.pictureurl ?= '/images/player.jpg'
      user.statustext ?= 'Ready for some foos'
      user.password = hash user.password, 'a little dog'
      try 
        newUserRepo.create user, cb
      catch e
        console.trace e
        callback e
  .then (err, newUsers, cb) ->
    callback err, newUsers?[0]
  
    
exports.getAllPlayers = (callback = ->) -> 
  query = {}
  try
    newUserRepo.read query, (readErr, cursor) ->
      if readErr?
        callback readErr
      else if cursor?
        cursor.toArray callback
      else
        callback()
        
  catch e
    console.log e
    throw e
    
    
exports.createResetPasswordToken = (username, callback = ->) ->
  console.assert username, 'username cannot be null'
  throw 'username cannot be null' unless username
  
  token = hash( '' + Math.floor( Math.random() * 100001), 'a little dog')
  
  utils.execute(newUserRepo.getByUsername, username)
  .then (err, @existingUser, cb) =>
    if err?
      callback err
    else if existingUser?
      findObj = _id : existingUser._id
      updateObj = 
        $set: 
          resettoken: token
          
      newUserRepo.update findObj, updateObj, {}, cb
    else
      callback 'Account not found'
  .then (err, updatedUser, cb) =>
    
    callback err, token, @existingUser
  
    
exports.getUserByToken = (token, callback = ->) ->
  console.assert token, 'token cannot be null'
  throw 'token cannot be null' unless token
  
  findObj = resettoken: token
  
  utils.execute(newUserRepo.read, findObj)
  .then (err, cursor, cb = ->) ->
    if err
      callback err
    else
      cursor.toArray cb
  .then (err, users, cb = ->) ->
    if err
      callback err
    else if users?.length is 0
      callback 'Token not found.'
    else
      callback err, users[0]
    cb()

    
exports.setPassword = (userid, password, callback = ->) ->
  console.assert userid, 'userid cannot be null'
  throw 'userid cannot be null' unless userid? and userid
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  encryptedPassword = hash password, 'a little dog'
  
  findObj = _id : userid
  updateObj = 
    $set: 
      password: encryptedPassword
      updatedat: new Date()
  
  try
    newUserRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e  
    
    
exports.assignTeam = (userid, team, callback = ->) ->
  console.assert userid, 'userid cannot be null'
  throw 'userid cannot be null' unless userid? and userid
  console.assert team, 'team cannot be null'
  throw 'team cannot be null' unless team?
  
  userid = new newUserRepo.ObjectId( userid ) if typeof userid is 'string'
  
  findObj = _id : userid
  updateObj = 
    $set:
      team: team
      updatedat: new Date()
    
  try
    newUserRepo.update findObj, updateObj, {}, callback  
  catch e
    console.trace e
    callback e  
    


###
take in a brief invite obj and return a full Invite object
###
loadFullInvite = (invite, callback = ->) ->
  teamid = invite?.teamid
  userid = invite?.invitor
  
  try
    utils.execute( teamRepo.getById, teamid )
    .then (err, team, cb = ->) ->
      invite.team = team
      
      try
        newUserRepo.getById userid, cb
      catch e
        console.trace e
        callback e
    .then (err, user, cb = ->) ->
      invite.invitor = user
      callback null, invite
  catch e
    console.trace e
    callback e

###
GET user object with all full properties
###    
exports.getFullUser = (userid, callback = ->) ->
  console.assert userid, 'userid cannot be null or 0'
  throw 'userid cannot be null or 0' unless userid
  
  utils.execute( newUserRepo.getById, userid )  # load user
  .then (err, @user, cb = ->) =>
    # load team
    return callback( err ) if err
    
    if @user?.team?
      try
        teamRepo.getById @user?.team?._id, cb
      catch e
        console.trace e
        cb e
    else 
      cb()
  .then (err, @team, cb = ->) =>   
    # Load posts
    return callback( err ) if err    
    @user?.team = @team

    if @user?.posts? and @user?.posts?.length
      try
        postGen = require './post'
        postGen.init()
        utils.mapAsync @user?.posts, postGen.makePostGen(@user), cb
      catch e
        console.trace e
        cb e
    else
      cb null, null
        
  .then (err, fullposts, cb = ->) =>    
    if fullposts?
      posts = (post for post in fullposts when post?.desc?)
    else
      posts = fullposts
      
    if posts?
      posts.sort (p1, p2) ->
        p2?.createdat - p1?.createdat
        
    @user?.posts = posts
    # Load invites
    try
      if @user?.invites and @user?.invites?.length
        utils.mapAsync @user?.invites, loadFullInvite, cb
      else
        cb()
    catch e
      console.trace e
      cb e
  .then (err, invites, cb = ->) =>
    return callback( err ) if err
    
    @user?.invites = invites
    
    # Load challenges
    if @team?.challenges?.length
      
      loadChallenge = (challenge, loadChallengeCallback = ->) ->
        teamRepo.getById challenge?.teamid, (loadChallengeErr, team) ->
          challenge.teamname = team?.teamname
          loadChallengeCallback loadChallengeErr, challenge
        
      utils.mapAsync @team?.challenges, loadChallenge, cb           
    else
      cb null, null    
  .then ( err, challenges, cb = ->) =>
    @team.challenges = challenges
    @user.challenges = challenges
    allmatches = @team?.matches
    # Load pending matches
    matches = (match for match in allmatches when match?.status is 'pending') if allmatches?
    
    if matches?.length      
      matchsvc = require './match'
      async = require 'async'
      
      loadMatch = (am, loadMatchCb = ->) =>
        matchsvc.getById am._id, (loadMatchErr, fullMatch) =>
          fullMatch?.hometeam = @team
          
          if fullMatch?.teams?
            for team in fullMatch?.teams
              do (team) =>
                if not team?._id?.equals( @team?._id )
                  fullMatch.opponentteam = team

          if fullMatch?.votes?
            for vote in fullMatch?.votes
              do (vote) =>
                if String(vote?.playerid) is String(@user._id)
                  fullMatch.voted = true
                
            loadVote = (vote, votecb = ->) ->
              newUserRepo.getById vote.playerid, (getByIdErr, user) ->
                vote.playername = user?.nickname
                votecb null, vote
            
            async.map fullMatch?.votes, loadVote, (loadVoteErr, fullVotes) ->
              fullMatch?.votes = fullVotes
              loadMatchCb loadMatchErr, fullMatch
          else
            loadMatchCb loadMatchErr, fullMatch
        
      async.map matches, loadMatch, ->
        cb.apply null, arguments
      #utils.mapAsync matches, loadMatch, cb
    else
      callback null, @user
  .then ( err, matches, cb = ->) =>
    @user.matches = matches
    callback null, @user
    

    
    
    
    
    
