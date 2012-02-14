crypto = require 'crypto'
userRepo = require '../repository/users'
teamRepo = require '../repository/teams'
utils = require 'utils'

hash = (msg, key) ->
  crypto.createHmac( 'sha256', key)
  .update(msg)
  .digest('hex')

loadUserTeam = (teamid, callback) ->
  if teamid? and teamid isnt 'undefined'
    teamRepo.getFullTeam String(teamid), callback
  else
    callback()

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
        user.wins = user.stats?.win ? 0
        user.losses = user.stats?.loss ? 0
        loadUserTeam user.team?._id, (err, team) ->
          user.challenges = team?.challenges
          user.challengeCount = team?.challenges?.length || 0
          user.matches = team?.matches
          user.matchCount = team?.matches?.length || 0
          callback null, user
      else
        callback null, user
  catch e
    console.log e
    callback e
