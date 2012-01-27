GLOBAL.DEBUG = true;

var Db = require('mongodb').Db
    , ObjectId = require('mongodb').ObjectID
    , Connection = require('mongodb').Connection
    , Server = require('mongodb').Server
    , dbName = 'wifefoosdb'
    , collectionName = 'teams'
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
};


//////////////////////////////////////////////////////////////
// Public functions begin
//////////////////////////////////////////////////////////////

exports.getTeamByName = function(teamname, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  getCollection(db, function(error, collection) {
    checkErrorFn(error, errorFn, function () {
      collection.findOne({teamname: teamname}, function (team) {
        if (team) {
          callback(null, team);
        } else {
          callback('Team not found');
        }
        db.close();
      });
    } );
  });
  
};


exports.getFullTeam = function(teamId, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  getCollection(db, function(error, collection) {
    checkErrorFn(error, errorFn, function () {
      
      console.log('Team Id = ', teamId, ' type ', typeof teamId);
      collection.findOne({_id: new ObjectId(teamId)}, function (team) {
        if (team) {
          callback(null, team);
        } else {
          callback('Team not found');
        }
        db.close();
      });
    } );
  });
  
}


exports.insertTeam = function(team, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      collection.insert(team, {safe: true}, function(error, docs) {
        checkErrorFn(error, errorFn, function() {
          if (!docs || !docs.length) {
            callback.call(this, 'Inserting team failed');
          } else {
            callback.call(this, null, docs[0]);
          }
          db.close();
        });
      });
    });
  });
};

//////////////////////////////////////////////////////////////
// Public functions end
//////////////////////////////////////////////////////////////
