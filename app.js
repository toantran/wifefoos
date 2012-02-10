(function() {
  var app, express;

  express = require('express');

  app = module.exports = express.createServer();

  require('./mvc').boot(app);

  app.listen(8080);

  if (typeof console !== "undefined" && console !== null) {
    console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);
  }

}).call(this);
