(function() {
  var Connection, Db, ObjectId, Repository, Server, Timestamp, checkError, dbName, db_connector, errorHandler, host, mongo, port, root, utils, _ref, _ref2,
    __slice = Array.prototype.slice;

  GLOBAL.DEBUG = true;

  root = typeof global !== "undefined" && global !== null ? global : window;

  mongo = require('mongodb');

  Db = mongo.Db, ObjectId = mongo.ObjectID, Timestamp = mongo.Timestamp, Connection = mongo.Connection, Server = mongo.Server;

  dbName = 'wifefoosdb';

  host = (_ref = process.env['MONGO_NODE_DRIVER_HOST']) != null ? _ref : 'localhost';

  port = (_ref2 = process.env['MONGO_NODE_DRIVER_PORT']) != null ? _ref2 : Connection.DEFAULT_PORT;

  db_connector = new Db(dbName, new Server(host, port, {}), {
    native_parser: false
  });

  exports.Db = Db;

  exports.ObjectId = ObjectId;

  exports.Timestamp = Timestamp;

  exports.Connection = Connection;

  exports.Server = Server;

  utils = require('../services/utils');

  /*
  exports.Db = Db
  exports.ObjectId = ObjectId
  exports.Timestamp = Timestamp
  exports.Connection = Connection
  exports.Server = Server
  */

  /*
  Default error handler
  */

  checkError = function(error, errorFn, next) {
    if (next == null) next = function() {};
    if (error != null) {
      console.log(error);
      return errorFn();
    } else {
      return next();
    }
  };

  /*
  Return a default error handler
  */

  errorHandler = errorHandler = function(db, callback) {
    if (callback == null) callback = function() {};
    return function(error) {
      try {
        if (db != null) db.close();
      } catch (e) {
        console.trace(e);
      }
      return callback(error);
    };
  };

  Repository = function(collectionName) {
    this.collectionName = collectionName;
  };

  Repository.prototype.setCollectionName = function(collectionName) {
    this.collectionName = collectionName;
  };

  Repository.prototype.getDb = function(callback) {
    var _ref3,
      _this = this;
    if (callback == null) callback = function() {};
    if ((root != null ? (_ref3 = root.db) != null ? _ref3.state : void 0 : void 0) !== 'connected') {
      return db_connector.open(function(err, db) {
        root.db = db;
        return callback(err, db);
      });
    } else {
      return callback(null, root.db);
    }
  };

  /*
  Return the default collection
  */

  Repository.prototype.getCollection = function(callback) {
    var _this = this;
    if (callback == null) callback = function() {};
    try {
      return utils.execute(utils.bind(this.getDb, this)).then(function(err, db, cb) {
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        return db != null ? db.collection(_this.collectionName, callback) : void 0;
      });
    } catch (e2) {
      console.trace(e2);
      return callback(e2);
    }
  };

  Repository.prototype.create = function(doc, callback) {
    var _this = this;
    if (callback == null) callback = function() {};
    if (typeof console !== "undefined" && console !== null) {
      console.assert(doc != null, 'Doc cannot be null');
    }
    if (doc == null) throw 'doc null';
    doc.createdat = new Date();
    return utils.execute(utils.bind(this.getCollection, this)).then(function(err, collection, cb) {
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      try {
        return collection != null ? collection.insert(doc, {
          safe: true
        }, callback) : void 0;
      } catch (e) {
        console.trace(e);
        return callback(e);
      }
    });
  };

  Repository.prototype.read = function() {
    var callback, findArgs, _i,
      _this = this;
    findArgs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    if (callback == null) callback = function() {};
    return utils.execute(utils.bind(this.getCollection, this)).then(function(err, collection, cb) {
      var cursor;
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      try {
        cursor = collection != null ? collection.find.apply(collection, findArgs) : void 0;
        return callback(null, cursor);
      } catch (e) {
        console.trace(e);
        return callback(e);
      }
    });
  };

  Repository.prototype.getById = function(docid, callback) {
    var _this = this;
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
      return cursor != null ? cursor.toArray(function(toArrayErr, docs) {
        if (toArrayErr) return callback(toArrayErr);
        if (!(docs != null ? docs.length : void 0)) return callback('Not found');
        callback(null, docs[0]);
        return cursor.close();
      }) : void 0;
    });
  };

  Repository.prototype.update = function(criteria, objNew, options, callback) {
    var _this = this;
    if (options == null) options = {};
    if (options.safe == null) options.safe = callback != null ? true : false;
    if (options.multi == null) options.multi = true;
    if (options.upsert == null) options.upsert = true;
    if (options['new'] == null) options['new'] = true;
    return utils.execute(utils.bind(this.getCollection, this)).then(function(err, collection, cb) {
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      try {
        return collection != null ? collection.update(criteria, objNew, options, callback) : void 0;
      } catch (e) {
        console.trace(e);
        if (callback != null) return callback(e);
      }
    });
  };

  Repository.prototype.save = function(doc, callback) {
    var _this = this;
    if (callback == null) callback = function() {};
    if (typeof console !== "undefined" && console !== null) {
      console.assert(doc != null, 'Doc must not be null');
    }
    if (doc == null) throw 'Empty doc';
    return utils.execute(utils.bind(this.getCollection, this)).then(function(err, collection, cb) {
      if (cb == null) cb = function() {};
      if (err) return callback(err);
      try {
        return collection != null ? collection.save(doc, {
          safe: true
        }, callback) : void 0;
      } catch (e) {
        console.trace(e);
        return callback(e);
      }
    });
  };

  Repository.prototype.remove = function(criteria, callback) {
    var _this = this;
    if (callback == null) callback = function() {};
    if (Object.keys(criteria).length === 0) throw 'Criteria is empty';
    return utils.execute(utils.bind(this.getCollection, this)).then(function(err, collection, cb) {
      if (cb == null) cb = function() {};
      if (collection != null) collection.remove(criteria);
      return callback();
    });
  };

  exports.Repository = Repository;

}).call(this);
