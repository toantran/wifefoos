(function() {
  var taskWrapper,
    __slice = Array.prototype.slice;

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

  exports.mapAsync = function(array, asyncMapFn, callback) {
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

  exports.seriesAsync = function(fnArray, initVal, callback) {
    var fns, next, val;
    if (fnArray == null) fnArray = [];
    if (callback == null) callback = function() {};
    fns = fnArray.slice();
    val = initVal;
    next = function(prevErr, prevVal) {
      var fn;
      if (prevErr != null) return callback(prevErr);
      fn = fns.shift();
      if ((fn != null) && typeof fn === 'function') {
        return fn(prevVal, next);
      } else {
        return callback(prevErr, prevVal);
      }
    };
    return next(null, val);
  };

  exports.throwIfNull = function() {
    var arg, nullArgs, _i, _len;
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      arg = arguments[_i];
      if (!(arg != null)) nullArgs = arg;
    }
    if ((nullArgs != null) && nullArgs.length) throw 'Null argument';
  };

  taskWrapper = function(task) {
    this.task = task;
    this.next = null;
    return this.done = false;
  };

  taskWrapper.prototype.callback = function(err, result) {
    this.done = true;
    if ((this.next != null) && typeof this.next === 'function') {
      if (this.wrapper == null) this.wrapper = new taskWrapper(this.next);
      return this.next.call(null, err, result, this.wrapper.callback.bind(this.wrapper));
    } else {
      this.taskErr = err;
      return this.taskResult = result;
    }
  };

  taskWrapper.prototype.then = function(next) {
    this.next = next;
    if ((this.next != null) && typeof this.next === 'function') {
      this.wrapper = new taskWrapper(this.next);
      if (this.done) {
        this.next.call(null, this.taskErr, this.taskResult, this.wrapper.callback.bind(this.wrapper));
      }
      return this.wrapper;
    }
  };

  exports.execute = function() {
    var args, task, wrapper;
    task = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    wrapper = new taskWrapper(task);
    args.push(wrapper.callback.bind(wrapper));
    task.apply(null, args);
    return wrapper;
  };

}).call(this);
