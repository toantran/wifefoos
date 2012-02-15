crypto = require 'crypto'
userRepo = require '../repository/users'
teamRepo = require '../repository/teams'
utils = require 'utils'

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
        team.matches = matches unless lm_err?
        lm_cb err,matches
        
    utils.parallel [__loadChallengesFn, __loadMatchesFn], (parallel_err, results) ->
      callback err, team

exports.authenticate = (username, password, callback) ->
  console.assert username, 'username cannot be null or empty'
  throw 'username is null or empty' unless username?
  
  encryptedPassword = hash password, 'a little dog'
  userRepo.getUser username, (error, user) ->
    if error
      callback error
    else if not user 
      callback 'User not found'
    else if encryptedPassword is user.password
      callback null, true, user
    else 
      callback null, false
        
        
exports.loadMobileUser = (userid, callback) ->
  console.assert userid, 'userid cannot be null or 0'  
  throw 'userid is null or empty' unless userid?
  
  try
    userRepo.getFullUser userid, (error, user) ->
      if error
        callback error
      else if user
        # populate property wins
        user.wins = user.stats?.win ? 0
        # populate property losses
        user.losses = user.stats?.loss ? 0
        # populate challenge count, match count
        loadUserTeam user.team?._id, (err, team) ->
          user.challenges = team?.challenges
          user.challengeCount = team?.challenges?.length || 0
          user.matches = team?.matches
          console.dir user.matches
          user.matchCount = team?.matches?.length || 0
          callback null, user
      else
        callback null, user
  catch e
    console.log e
    callback e
