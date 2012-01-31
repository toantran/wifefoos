GLOBAL.DEBUG = true;

var mongo = require('mongodb')
    , Db = mongo.Db
    , ObjectId = mongo.ObjectID
    , Timestamp = mongo.Timestamp
    , Connection = mongo.Connection
    , Server = mongo.Server
    , dbName = 'wifefoosdb'
    , collectionName = 'users'
    , host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost'
    , port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;


function getCollection(db, callback) {
  var errorFn = function(error) {        
        callback.call(this, error);
      };
  
  callback = callback || function() {};
  
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
  
  callback = callback || function() {};    
  
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
      
  callback = callback || function() {};
    
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

  callback = callback || function() {};
    
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
  
  return true;
}


exports.insertUser = function(user, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
  
  callback = callback || function() {};
  
  user = user || {};
  user.createdat = new Date();
   
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      
      user.pictureurl = user.pictureurl || '/images/player.jpg';
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
  
  callback = callback || function() {};
        
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


exports.setTeam = function (userid, team, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
        return false;
      };
  
  callback = callback || function() {};
      
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      collection.findAndModify({
        _id: new ObjectId(userid)
      }, {
      }, {
        $set: {
          team: team
          , invites: []
          , updatedat: new Date()
        }
      }, {
        safe: true
        , 'new':true
      }, function(error, docs) {
        checkErrorFn(error, errorFn, function() {
          callback.call(this, error, docs);
          db.close();
        });
      });
    });
  });
  
  return true;
}


exports.addPost = function (userid, post, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
        return false;
      };
  
  callback = callback || function() {};
  
  post = post || {};
  post.createdat = new Date();
  post.id = new ObjectId();
      
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      
      collection.findAndModify({
        _id: new ObjectId(userid)
      }, {
      }, {
        $addToSet: {
          posts: post
        }
        , $set: {
          updatedat: new Date()
        }
      }, {
        safe: true
        , 'new':true
      }, function(error, docs) {
        checkErrorFn(error, errorFn, function() {
          callback.call(this, error, docs);
          db.close();
        });
      });
    });       
  });

  return true;
}


exports.addInvite = function(userid, invite, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
        return false;
      };
      
  callback = callback || function() {};
  
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      
      collection.findAndModify({
        _id: new ObjectId(userid)
      }, {
      }, {
        $addToSet: {
          invites: invite
        }
        , $set: {
          updatedat: new Date()
        }
      }, {
        safe: true
        , 'new':true
      }, function(error, docs) {
        checkErrorFn(error, errorFn, function() {
          callback.call(this, error, docs);
          db.close();
        });
      });
    });       
  });

  return true;
}


//////////////////////////////////////////////////////////////
// Public functions end
//////////////////////////////////////////////////////////////

