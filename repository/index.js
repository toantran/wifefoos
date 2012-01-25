GLOBAL.DEBUG = true;

var Db = require('mongodb').Db
    , Connection = require('mongodb').Connection
    , Server = require('mongodb').Server
    , dbName = 'wifefoosdb';
  
var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;


function checkErrorFn(error, errorFn, next) {
  if (error) {
    console.log(error);
    errorFn.call(this);
  } else if (next && typeof next === 'function'){
    next.call(this);
  }
};


exports.getUser = function(username, callback) {
  var db = new Db(dbName, new Server(host, port, {}), {native_parser:false}),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  console.log('connecting to db at ', host, ':', port);
  
  db.open(function(error, db) {  
    checkErrorFn(error, errorFn, function() {    
      db.collection('users', function(error, collection) {
        checkErrorFn(error, errorFn, function() {
          collection.find( {username: username} , function(error, cursor) {
            checkErrorFn(error, errorFn, function() {
              cursor.nextObject(function(error, doc) {
                checkErrorFn(error, errorFn, function() {
                  callback.call(this, null, doc);
                  db.close();
                });
              });
            });
          });
        });       
      });
    });
  }); 

  return true;
};


exports.insertUser = function(user, callback) {
  var db = new Db(dbName, new Server(host, port, {}), {native_parser:false}),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  console.log('connecting to db at ', host, ':', port);
  db.open(function(error, db) {  
    checkErrorFn(error, errorFn, function() {    
      db.collection('users', function(error, collection) {
        checkErrorFn(error, errorFn, function() {
        
          collection.insert([user], {safe: true}, function(error, docs) {
            checkErrorFn(error, errorFn, function() {
              if (!docs || !docs.length) {
                callback.call(this, 'Inserting user failed');
              } else {
                callback.call(this, null, docs[0]);
              }
              db.close();
            });
          });
        });       
      });
    });
  }); 

  return true;
}
