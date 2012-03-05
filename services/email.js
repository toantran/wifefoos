(function() {
  var emailpassword, nodemailer, transport;

  try {
    nodemailer = require("nodemailer");
    emailpassword = require('./emailpassword');
    transport = nodemailer.createTransport('SMTP', {
      service: 'Gmail',
      name: 'jsnod.com',
      auth: {
        user: 'wflgamekeeper@gmail.com',
        pass: emailpassword.password
      }
    });
  } catch (e) {
    console.trace(e);
  }

  exports.sendmail = function(opts, callback) {
    var mailOpts;
    if (callback == null) callback = function() {};
    mailOpts = opts != null ? opts : {};
    if (mailOpts.transport == null) mailOpts.transport = transport;
    mailOpts.from || (mailOpts.from = 'wflgamekeeper@gmail.com');
    if (!mailOpts.to) {
      return callback('To address missing');
    } else {
      try {
        return nodemailer.sendMail(mailOpts, callback);
      } catch (e) {
        console.trace(e);
        return callback(e);
      }
    }
  };

}).call(this);
