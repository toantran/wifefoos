(function() {

  exports.map = function(array, asyncMapFn, callback) {
    var counter, index, item, new_array, runit, _len, _results;
    if (array == null) array = [];
    counter = array.length;
    new_array = [];
    runit = function(item, index) {
      return asyncMapFn(item, function(err, result) {
        if (err) {
          return callback(err);
        } else {
          new_array[index] = result;
          counter--;
          if (counter === 0) return callback(null, new_array);
        }
      });
    };
    _results = [];
    for (index = 0, _len = array.length; index < _len; index++) {
      item = array[index];
      _results.push(runit(item, index));
    }
    return _results;
  };

  exports.parallel = function(fnArray, callback) {
    var counter, fn, index, resultArray, runit, _len, _results;
    if (fnArray == null) fnArray = [];
    counter = fnArray.length;
    resultArray = [];
    runit = function(fn, index) {
      return fn(function(err, result) {
        if (err) {
          return callback(err);
        } else {
          resultArray[index] = result;
          counter--;
          if (counter === 0) return callback(null, resultArray);
        }
      });
    };
    _results = [];
    for (index = 0, _len = fnArray.length; index < _len; index++) {
      fn = fnArray[index];
      _results.push(runit(fn, index));
    }
    return _results;
  };

}).call(this);
