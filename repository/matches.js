GLOBAL.DEBUG = true;

var mongo = require('mongodb')
    , Db = mongo.Db
    , ObjectId = mongo.ObjectID
    , Timestamp = mongo.Timestamp
    , Connection = mongo.Connection
    , Server = mongo.Server
    , dbName = 'wifefoosdb'
    , collectionName = 'matches'
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
};


//////////////////////////////////////////////////////////////
// Public functions begin
//////////////////////////////////////////////////////////////


exports.getCollection = function(callback) {
  
  callback = callback || function() {};
  
  var db = getDb();
  
  getCollection(db, callback);
  
}


exports.get = function(matchid, callback) {
  callback = callback || function() {};
  
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  getCollection(db, function(error, collection) {
    checkErrorFn( error, errorFn, function() {
      
      var mm = collection.findOne( { _id: new ObjectId(matchid)}, function(error, m) {
        callback( error, m);
        db.close();
      });    
      
    });  
  });
  
  return true;
}


exports.insertMatch = function(am, callback) {
  callback = callback || function() {};
  
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
  
  am.createdat = new Date();
      
  getCollection(db, function(error, collection) {
    checkErrorFn( error, errorFn, function() {
      collection.insert( am, {safe: true}, function(error, m) {
        if (m && (m.length === +m.length)) {
          m = m[0];
        }
        callback( error, m);
        db.close();
      });    
    });  
  });
  
}


exports.addVote = function(matchid, vote, callback) {
  callback = callback || function() {};
  
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  vote = vote || {};
  //vote.createdat = new Date();
  
  getCollection(db, function(error, collection) {
    checkErrorFn( error, errorFn, function() {
      collection.findAndModify( {
        _id: new ObjectId(matchid)
      }, {
      }, {
        $addToSet: {
          votes: vote
        }
        , $set: {
          updatedat: new Date()
        }
      }, {
        safe: true
        , 'new': true
      }, function(error, m) {
        if (m && (m.length === +m.length)) {
          m = m[0];
        }
        callback( error, m);
        db.close();
      });    
    });  
  });  
}



exports.setStatus = function(matchid, status, callback) {
  callback = callback || function() {};
  
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
        
  getCollection(db, function(error, collection) {
    checkErrorFn( error, errorFn, function() {
      collection.findAndModify( {
        _id: new ObjectId(matchid)
      }, {
      }, {
        $set: {
          status: status
          , updatedat: new Date()
        }
      }, {
        safe: true
        , 'new': true
      }, function(error, m) {
        if (m && (m.length === +m.length)) {
          m = m[0];
        }
        callback( error, m);
        db.close();
      });    
    });  
  });  
}


//////////////////////////////////////////////////////////////
// Public functions end
//////////////////////////////////////////////////////////////
