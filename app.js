
/**
 * Module dependencies.
 */
//change to test
var express = require('express');

var app = module.exports = express.createServer( );

require('./mvc').boot(app);

app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
