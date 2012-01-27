GLOBAL.DEBUG = true;

var Db = require('mongodb').Db
    , ObjectId = require('mongodb').ObjectID
    , Connection = require('mongodb').Connection
    , Server = require('mongodb').Server
    , dbName = 'wifefoosdb'
    , collectionName = 'users'
    , host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost'
    , port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;


function getCollection(db, callback) {
  var errorFn = function(error) {        
        callback.call(this, error);
      };
  
  db.open( function(error, db) {    
    checkErrorFn(error, errorFn, function() {        
      db.collection(collectionName, function(error, collection) {        
        checkErrorFn(error, function(err) {
          errorFn.call(this, err);
          db.close();
        }, function() {
          callback.call(this, null, collection);
        });       
      });
    });
    
  }); 
};

function checkErrorFn(error, errorFn, next) {
  if (error) {
    console.log(error);
    errorFn.call(this);
  } else if (next && typeof next === 'function'){
    next.call(this);
  }
};


function getDb() {
  return new Db(dbName, new Server(host, port, {}), {native_parser:false});
}


//////////////////////////////////////////////////////////////
// Public functions begin
//////////////////////////////////////////////////////////////

exports.getUser = function(username, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  console.log('connecting to db at ', host, ':', port);
  
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      collection.find( {
        username: username
      }, {
        username: 1
      , nickname: 1
      , password: 1
      , firstname: 1
      , lastname: 1
      , team: 1
      } , function(error, cursor) {
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
  
  return true;
};


exports.getFullUser = function(userId, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  console.log('connecting to db at ', host, ':', port);
  
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      collection.find( {
        _id: new ObjectId(userId)
      } , function(error, cursor) {
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
  
  return true;
};


exports.getAllUsers = function (callback) {
  var db = getDb()
    , errorFn = function (error) {
      db.close();
      callback.call(this, error);
    };
    
  getCollection( db, function(err, collection) {
  
    checkErrorFn(err, errorFn, function() {
      var cursor = collection.find( {}, {
        nickname: 1
        , pictureurl: 1
        , stats: 1
        , team: 1        
        , statustext: 1
        , username: 1
      }).toArray( function(err, users) {
        checkErrorFn(err, errorFn, function() {
          callback.call(this, null, users);
          db.close();
        });
      });
    });
    
  });
}


exports.insertUser = function(user, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
        
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      
      user.pictureurl = user.pictureurl || '../../images/player.jpg';
      user.statustext = user.statustext || 'Ready for some foos!';
      
      collection.insert([user], {safe: true}, 
        function(error, docs) {
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

  return true;
};


exports.saveUser = function(user, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
        return false;
      };
        
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      
      collection.save(user, 
        function(error, docs) {
          checkErrorFn(error, errorFn, function() {
            callback.call(this, error, user);
            db.close();
          });
      });
    });       
  });

  return true;
}; 

//////////////////////////////////////////////////////////////
// Public functions end
//////////////////////////////////////////////////////////////

