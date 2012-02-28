(function() {
  var f1, f2, f3, utils;

  f1 = function(name, cb) {
    console.log('running 1', name);
    return cb(null, 'done 1');
  };

  f2 = function(err, result, cb) {
    console.log('running 2', err, result);
    return cb(null, 'done 2');
  };

  f3 = function(err, result, cb) {
    console.log('running 3', err, result);
    return cb(null, 'done 3');
  };

  utils = require('./services/utils');

  utils.execute(f1, 'Toan').then(f2).then(f3);

}).call(this);
