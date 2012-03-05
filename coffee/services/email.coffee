try
  nodemailer = require "nodemailer"
  emailpassword = require './emailpassword'
  transport = nodemailer.createTransport 'SMTP',
    service: 'Gmail'
    name: 'jsnod.com'
    auth: 
      user: 'wflgamekeeper@gmail.com'
      pass: emailpassword.password
catch e
  console.trace e
  
exports.sendmail = (opts, callback = ->) ->
  mailOpts = opts ? {}
  
  mailOpts.transport ?= transport
  mailOpts.from or= 'wflgamekeeper@gmail.com'
  
  if not mailOpts.to
    callback 'To address missing'
  else
    try
      nodemailer.sendMail mailOpts, callback 
    catch e
      console.trace e
      callback e
