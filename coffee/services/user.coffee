crypto = require 'crypto'
userRepo = require '../repository/users'

hash = (msg, key) ->
  crypto.createHmac( 'sha256', key)
  .update(msg)
  .digest('hex')


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
      else
        callback null, user
  catch e
    console.log e
    callback e
