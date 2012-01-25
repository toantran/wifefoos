
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

require('./mvc').boot(app);

app.listen(8000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
