(function() {
  var Connection, Db, ObjectId, Server, Timestamp, checkError, dbName, errorHandler, getDb, host, mongo, port, repository, _ref, _ref2,
    __slice = Array.prototype.slice;

  GLOBAL.DEBUG = true;

  mongo = require('mongodb');

  Db = mongo.Db, ObjectId = mongo.ObjectID, Timestamp = mongo.Timestamp, Connection = mongo.Connection, Server = mongo.Server;

  dbName = 'wifefoosdb';

  host = (_ref = process.env['MONGO_NODE_DRIVER_HOST']) != null ? _ref : 'localhost';

  port = (_ref2 = process.env['MONGO_NODE_DRIVER_PORT']) != null ? _ref2 : Connection.DEFAULT_PORT;

  exports.setCollectionName = function(collectionName) {
    this.collectionName = collectionName;
  };

  exports.Db = Db;

  exports.ObjectId = ObjectId;

  exports.Timestamp = Timestamp;

  exports.Connection = Connection;

  exports.Server = Server;

  /*
  Default error handler
  */

  exports.checkError = checkError = function(error, errorFn, next) {
    if (next == null) next = function() {};
    if (error != null) {
      console.log(error);
      return errorFn();
    } else if ((next != null) && typeof next === 'function') {
      return next.call();
    }
  };

  /*
  Return the default DB
  */

  exports.getDb = getDb = function() {
    return new Db(dbName, new Server(host, port, {}), {
      native_parser: false
    });
  };

  /*
  Return a default error handler
  */

  exports.errorHandler = errorHandler = function(db, callback) {
    if (callback == null) callback = function() {};
    return function(error) {
      db.close;
      return callback(error);
    };
  };

  repository = function(collectionName) {
    this.collectionName = collectionName;
  };

  repository.prototype.setCollectionName = function(collectionName) {
    this.collectionName = collectionName;
  };

  /*
  Return the default collection
  */

  repository.prototype.getCollection = function(db, callback) {
    var errorFn,
      _this = this;
    if (callback == null) callback = function() {};
    errorFn = function(error) {
      return callback(error);
    };
    try {
      return db.open(function(openErr, openDb) {
        return checkError(openErr, errorFn, function() {
          try {
            return openDb.collection(_this.collectionName, function(collectionErr, collection) {
              if (collectionErr != null) {
                callback(collectionErr);
                return db.close();
              } else {
                return callback(null, collection);
              }
            });
          } catch (e2) {
            console.trace(e2);
            return callback(e2);
          }
        });
      });
    } catch (e) {
      console.trace(e);
      return callback(e);
    }
  };

  repository.prototype.create = function(doc, callback) {
    var db, errorFn;
    if (callback == null) callback = function() {};
    if (typeof console !== "undefined" && console !== null) {
      console.assert(doc != null, 'Doc cannot be null');
    }
    if (doc == null) throw 'doc null';
    db = getDb();
    errorFn = errorHandler(db, callback);
    doc.createdat = new Date();
    return this.getCollection(db, function(collectionErr, collection) {
      return checkError(collectionErr, errorFn, function() {
        try {
          return collection.insert(doc, {
            safe: true
          }, function() {
            callback.apply(this, arguments);
            return db.close();
          });
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      });
    });
  };

  repository.prototype.read = function() {
    var callback, db, errorFn, findArgs, _i;
    findArgs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    if (callback == null) callback = function() {};
    db = getDb();
    errorFn = errorHandler(db, callback);
    return this.getCollection(db, function(collectionErr, collection) {
      return checkError(collectionErr, errorFn, function() {
        var cursor;
        try {
          cursor = collection.find.apply(collection, findArgs);
          return callback(null, cursor);
        } catch (e) {
          console.trace(e);
          return callback(e);
        }
      });
    });
  };

  repository.prototype.getById = function(docid, callback) {
    if (callback == null) callback = function() {};
    if (typeof console !== "undefined" && console !== null) {
      console.assert((docid != null) && docid !== 'undefined', 'docid must be defined');
    }
    if (!((docid != null) && docid !== 'undefined')) throw 'Invalid id';
    if (typeof docid === 'string') docid = new ObjectId(docid);
    return this.read({
      _id: docid
    }, function(readErr, cursor) {
      if (readErr) return callback(readErr);
      return cursor.toArray(function(toArrayErr, docs) {
        if (toArrayErr) return callback(toArrayErr);
        if (!(docs != null ? docs.length : void 0)) return callback('Not found');
        return callback(null, docs[0]);
      });
    });
  };

  repository.prototype.update = function(criteria, objNew, options, callback) {
    var db, errorFn;
    if (options == null) options = {};
    db = getDb();
    errorFn = errorHandler(db, callback);
    options.safe = callback != null ? true : false;
    options.multi = true;
    options.upsert = true;
    options['new'] = true;
    return this.getCollection(db, function(collectionErr, collection) {
      return checkError(collectionErr, errorFn, function() {
        try {
          return collection.update(criteria, objNew, options, function() {
            db.close();
            return callback.apply(this, arguments);
          });
        } catch (e) {
          console.trace(e);
          if (callback != null) return callback(e);
        }
      });
    });
  };

  repository.prototype.save = function(doc, callback) {
    var db, errorFn;
    if (callback == null) callback = function() {};
    if (doc == null) throw 'Empty doc';
    db = getDb();
    errorFn = errorHandler(db, callback);
    return this.getCollection(db, function(collectionErr, collection) {
      return checkError(collectionErr, errorFn, function() {
        try {
          return collection.save(doc, {
            safe: true
          }, function() {
            db.close();
            return callback.apply(this, arguments);
          });
        } catch (e) {
          console.trace(e);
          if (callback != null) return callback(e);
        }
      });
    });
  };

  repository.prototype.remove = function(criteria, callback) {
    var db, errorFn;
    if (callback == null) callback = function() {};
    if (Object.keys(criteria).length === 0) throw 'Criteria is empty';
    db = getDb();
    errorFn = errorHandler(db, callback);
    return this.getCollection(db, function(collectionErr, collection) {
      return checkError(collectionErr, errorFn, function() {
        collection.remove(criteria);
        return callback();
      });
    });
  };

  exports.repository = repository;

}).call(this);
