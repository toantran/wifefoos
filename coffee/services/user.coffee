crypto = require 'crypto'
newUserRepo = require '../repository/users2'
teamRepo = require '../repository/teams'
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
    console.log 'encryptedPassword %s   user.password %s', encryptedPassword, user.password
    if error
      callback error
    else if not user 
      callback 'User not found'
    else if encryptedPassword is user.password
      callback null, true, user
    else 
      callback null, false
        


###
LOAD a user document with all neccessary properties re-populated in the root object
###        
exports.loadMobileUser = (userid, callback) ->
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
    
  try
    newUserRepo.update findObj, updateObj, callback
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
    newUserRepo.update findObj, updateObj, callback  
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
    newUserRepo.update findObj, updateObj, callback  
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
    newUserRepo.update findObj, updateObj, callback  
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
    newUserRepo.update findObj, updateObj, callback  
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
    newUserRepo.update findObj, updateObj, callback  
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
      for post in user?.posts
        if post?.id?.equals( postid )
          post.comments or= []
          post.comments.push data
      newUserRepo.save user, callback
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
    newUserRepo.update findObj, updateObj, callback  
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
    
    
    
    
    
    
