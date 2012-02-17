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


exports.updatepicture = function(userid, pictureurl, callback) {
  var db = getDb()
      , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  callback = callback || function() {};
  
  try {
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        collection.findAndModify({
          _id: new ObjectId(userid)
        }, {  // sorting object
        }, {
          $set: { 
            pictureurl: pictureurl
            , updatedat: new Date()
          }
        }, {
          safe: true
        }, callback);
      });
    });
  }
  catch(e) {
    callback(e);
  }
  
  return true;   
}


exports.addVote = function(userid, vote, callback) {
  var db = getDb()
      , errorFn = function(error) {
        db.close();
        callback.call(this, error);
      }
      , logObj = {
        type: 'matchresult'
        , data: {
          matchid: vote.matchid
          , teamid: vote.teamid
        }
        , createdat: new Date()
      };
      
  callback = callback || function() {};
  
  try {
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        collection.findAndModify({
          _id: new ObjectId(userid)
        }, {  // sorting object
        }, {
          $addToSet: { 
            votes: vote
            , logs: logObj
          }
          , $set: {updatedat: new Date()}
        }, {
          safe: true
        }, callback);
      });
    });
  }
  catch(e) {
    callback(e);
  }
  
  return true;    
}



exports.getUser = function(username, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
  
  callback = callback || function() {};    
  
  try {
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
  }
  catch(e) {
    callback(e);
  }
  return true;
};


exports.getFullUser = function(userid, callback) {
  var db = getDb(),
      errorFn = function(error) {
        db.close();
        callback.call(this, error);
      };
      
  callback = callback || function() {};
  
  console.log('userid = ', userid, typeof(userid));
  if (!userid || (typeof userid !== 'string')) {
    errorFn('Id is invalid ', userid);
    return;
  }
  
  try {
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        collection.find( {
          _id: new ObjectId(userid)
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
  } catch(e) {
    callback(e);
  }
  
  return true;
};


exports.getAllUsers = function (callback) {
  var db = getDb()
    , errorFn = function (error) {
      db.close();
      callback.call(this, error);
    };

  callback = callback || function() {};
  
  try {  
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
  } catch(e) {
    callback(e);
  }
  
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
   
  try {
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
  } catch(e) {
    callback(e);
  }

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
        
  try {
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
  } catch(e) {
    callback(e);
  }
  
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
      
  if (!userid || typeof userid !== 'string') {
    errorFn('Id is invalid ', userid);
    return;
  }
  
  try {
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
  } catch(e) {
    callback(e);
  }
  
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
  
  if (!userid || typeof userid !== 'string') {
    errorFn('Id is invalid ', userid);
    return;
  }
  
  
  post = post || {};
  post.createdat = new Date();
  post.id = new ObjectId();
  
  try {    
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        
        collection.findAndModify({
          _id: new ObjectId(userid)
        }, {  // sorting object
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
  } catch(e) {
    callback(e);
  }
  
  return true;
}



exports.removePost = function(userid, postid, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
        return false;
      };
      
  callback = callback || function() {};
  
  if (!userid || typeof userid !== 'string') {
    errorFn('Id is invalid ', userid);
    return;
  }
  
  try {
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        
        collection.findAndModify({
          _id: new ObjectId(userid)
        }, {
        }, {
          $pull: {
            posts: {id: new ObjectId(postid)}
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
  } catch(e) {
    callback(e);
  }
  
  return true;
}


exports.addComment = function(userid, postid, data, callback) {
  var db = getDb()
    , errorFn = function(error) {
        db.close();
        callback.call(this, error);
        return false;
      }
    , postObjId = new ObjectId(postid);
      
  callback = callback || function() {};
  data = data || {};
  data.id = new ObjectId();
  data.createdat = new Date();
  
  if (!userid || typeof userid !== 'string') {
    errorFn('Id is invalid ', userid);
    return;
  }
  
  try {
    getCollection( db, function(error, collection) {
      checkErrorFn(error, errorFn, function() {
        
        var cursor = collection.find({_id: new ObjectId(userid)});
        cursor.each( function(error, user) {
          if(!error && user && user.posts) {            
            user.posts.forEach( function(post) {
              if (post.id && post.id.equals(postObjId)) {
                post.comments = post.comments || [];
                post.comments.push(data);                
              }
            });
            collection.save(user);
          }
        } );
        
        callback(null, data);
        /*
        collection.findAndModify({
          _id: new ObjectId(userid)
        }, {
        }, {
          $addToSet: {
            'posts.comments': data
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
        */
      });       
    });
  } catch(e) {
    callback(e);
  }
  
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
  
  if (!userid || typeof userid !== 'string') {
    errorFn('Id is invalid ', userid);
    return;
  }
  
  try {
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
  } catch(e) {
    callback(e);
  }
  
  return true;
}


exports.updateStats = function(teamid, opponentid, win, callback) {
  var db = getDb()
    , errorFn = function(error) {
      db.close();
      callback.call(this, error);
    }
    , incObj = win ? {'stats.win':1} : {'stats.loss': 1}
    , statLog = {
      id: new ObjectId()
      , type: 'matchresult'
      , data: {
        opponentid: opponentid
        , result: win ? 'win' : 'lose'
      }
      , createdat: new Date()
    };
  
  callback = callback || function() {};
    
  getCollection( db, function(error, collection) {
    checkErrorFn(error, errorFn, function() {
      
      collection.update({
        'team._id': new ObjectId(teamid)
      }, {
        $inc: incObj
        , $set: {
          updatedat: new Date()
        }
        , $addToSet: {
          posts: statLog
        }
      }, {
        safe: true
        , multi: true
      }, callback);
      
    });
  });
  
  return true;
}



//////////////////////////////////////////////////////////////
// Public functions end
//////////////////////////////////////////////////////////////

