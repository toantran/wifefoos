baseDb = require('./base')
baseRepo = new baseDb.repository('matches')

{Db, ObjectId, Timestamp, Connection, Server, checkError, errorHandler, getDb} = baseDb

exports.create = () ->
  baseRepo.create.apply baseRepo, arguments
exports.read = () ->
  baseRepo.read.apply baseRepo, arguments
exports.update = () ->
  baseRepo.update.apply baseRepo, arguments
exports.save = () ->
  baseRepo.save.apply baseRepo, arguments  
exports.remove = () ->
  baseRepo.remove.apply baseRepo, arguments
exports.getById = () ->
  baseRepo.getById.apply baseRepo, arguments
exports.ObjectId = ObjectId


exports.addVote = (matchid, vote, callback = ->) ->
  console.assert matchid, 'matchid cannot be null or 0'
  throw 'matchid cannot be null or 0' unless matchid
  
  matchid = new ObjectId(matchid) if typeof matchid is 'string'
  
  findObj = 
  
  baseRepo.update 
  
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
