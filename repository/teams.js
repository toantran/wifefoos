GLOBAL.DEBUG = true;

var mongo = require('mongodb')
    , Db = mongo.Db
    , ObjectId = mongo.ObjectID
    , Timestamp = mongo.Timestamp
    , Connection = mongo.Connection
    , Server = mongo.Server
    , dbName = 'wifefoosdb'
    , collectionName = 'teams'
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

exports.getTeamByName = function(teamname, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
  
  callback = callback || function() {};
  
  try {    
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
  } catch(e) {
    callback(e);
  }
  
  return true;
};


exports.getFullTeam = function(teamid, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  callback = callback || function() {};
  
  if (!teamid || typeof teamid !== 'string') {
    errorFn('Id is invalid ', teamid);
    return;
  }
  
  try {
    getCollection(db, function(error, collection) {
      checkErrorFn(error, errorFn, function () {
        
        collection.findOne({_id: new ObjectId(teamid)}, function (error, team) {
          callback(error, team);
          db.close();
        });
      } );
    });
  } catch(e) {
    callback(e);
  }
  
  return true;
}


exports.insertTeam = function(team, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
  
  callback = callback || function() {};
      
  team = team || {};
  team.createdat = new Date();
  
  try {
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
  } catch(e) {
    callback(e);
  }
  
  return true;
};


exports.getAll = function ( callback ) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
  
  callback = callback || function() {};
  
  try {    
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        var cursor = collection.find()
        .toArray( function(error, teams) {
          callback(error, teams);
          db.close();
        });      
      });
    } );
  } catch(e) {
    callback(e);
  }
  
  return true;
}


exports.addJoinRequest = function (teamid, request, callback) {
  var db = getDb()
    , errorFn = function(error) {
      db.close();
      callback.call(this, error);
    }
    , timestamp = new Date()
    , post= {
      id: new ObjectId()
      , type: 'joinrequest'
      , data: {
        userid: request.requestor
      }
      , createdat: timestamp
    };
  
  callback = callback || function() {};
  
  if (!teamid || typeof teamid !== 'string') {
    errorFn('Id is invalid ', teamid);
    return;
  }
    
  request = request || {};
  //request.createdat = timestamp;
   
  try { 
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        collection.findAndModify({
          _id: new ObjectId(teamid)
        }, {
        }, {
          $addToSet: {
            joinrequests: request
            , posts: post
          }
        }, {
          safe: true
          , 'new':true
        }, function(error) {
          callback(error);
        });
      });
    });
  } catch(e) {
    callback(e);
  }
    
  return true;
}


exports.addPlayer = function(teamid, userid, callback) {
  var db = getDb()
    , errorFn = function(error) {
      db.close();
      callback.call(this, error);
    }
    , joiningPost = {
      type: 'join'
      , data: {
        userid: userid
      }
      , createdat: new Date()
    };
  
  callback = callback || function() {};
  
  if (!teamid || typeof teamid !== 'string') {
    errorFn('Id is invalid ', teamid);
    return;
  }
  
  // add userid to member list
  // add joining post
  // remove from joinrequest (if any)
  
  console.log(teamid, userid);
  
  try {
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        collection.findAndModify({
          _id: new ObjectId(teamid)
        }, {
        }, {
          $addToSet: {
            members: userid
            , posts: joiningPost
          }
          , $pull: {
            joinrequests: {requestor: userid}
          }
        }, {
          safe: true
          , 'new':true
        }, callback);
      });
    });
  } catch(e) {
    callback(e);
  }
  
  return true;
}


exports.addChallengeFrom = function(teamid, challenge, callback) {
  var db = getDb()
    , errorFn = function(error) {
      db.close();
      callback.call(this, error);
    }
    , challengePost = {
      type: 'join'
      , data: {
        userid: userid
      }
      , createdat: new Date()
    };
    
  callback = callback || function() {};
  
  if (!teamid || !challenge) {
    callback('inputs null');
    return false;
  }
  
  callback();
  
  return true;
}

//////////////////////////////////////////////////////////////
// Public functions end
//////////////////////////////////////////////////////////////
