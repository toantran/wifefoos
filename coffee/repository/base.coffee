GLOBAL.DEBUG = true

mongo = require 'mongodb'
{Db, ObjectID: ObjectId, Timestamp, Connection, Server} = mongo

dbName = 'wifefoosdb'
host = process.env['MONGO_NODE_DRIVER_HOST'] ? 'localhost'
port = process.env['MONGO_NODE_DRIVER_PORT'] ? Connection.DEFAULT_PORT;

exports.setCollectionName = (@collectionName) ->

exports.Db = Db
exports.ObjectId = ObjectId
exports.Timestamp = Timestamp
exports.Connection = Connection
exports.Server = Server




###
Default error handler
###
exports.checkError = checkError = (error, errorFn, next = ->) ->
  if error?
    console.log error
    errorFn()
  else if next? and typeof next is 'function'
    next.call()


###
Return the default DB
###    
exports.getDb = getDb = ->
  new Db dbName, new Server(host, port, {}), native_parser:false


###
Return a default error handler
###
exports.errorHandler = errorHandler = (db, callback = ->) ->
  (error) ->
    db.close
    callback error



repository = (@collectionName) ->
repository::setCollectionName = (@collectionName) ->

###
Return the default collection
###  
repository::getCollection = (db, callback = ->) ->
  errorFn = (error) ->
    callback error
  
  try
    db.open (openErr, openDb) =>
      checkError openErr, errorFn, =>
        try
          openDb.collection @collectionName, (collectionErr, collection) ->
            if collectionErr?
              callback collectionErr
              db.close()
            else
              callback null, collection
        catch e2
          console.trace e2
          callback e2
  catch e
    console.trace e
    callback e

        
repository::create = (doc, callback = ->) ->  
  console?.assert doc?, 'Doc cannot be null'
  throw 'doc null' unless doc?
  db = getDb()
  errorFn = errorHandler db, callback
  
  doc.createdat = new Date()
  
  @getCollection db, (collectionErr, collection) ->
    checkError collectionErr, errorFn, ->
      try
        collection.insert doc, {safe: true}, () ->
          callback.apply this, arguments
          db.close()
      catch e
        console.trace e
        callback e      


repository::read = (findArgs..., callback = ->) ->
  db = getDb()
  errorFn = errorHandler db, callback
  
  console.log 'Inside read ', this
  @getCollection db, (collectionErr, collection) ->
    checkError collectionErr, errorFn, ->
      try
        cursor = collection.find.apply collection, findArgs
        cursor.toArray (toArrayErr, docs) ->
          db.close()
          console.log toArrayErr if toArrayErr
          callback.apply this, arguments
      catch e
        console.trace e
        callback e
        

repository::getById = (docid, callback = ->) ->
  console?.assert docid? and docid isnt 'undefined', 'docid must be defined'
  throw 'Invalid id' unless docid? and docid isnt 'undefined'
  
  docid = new ObjectId(docid) if typeof docid is 'string'
  @read _id: docid, (readErr, docs) ->
    if (not readErr?)  and docs?.length
      callback null, docs[0]  
    else
      callback readErr, docs


repository::update = (criteria, objNew, options = {}, callback) ->
  db = getDb()
  errorFn = errorHandler db, callback
  options.safe = if callback? then true else false
  options.multi = true
  options.upsert = true
  
  @getCollection db, (collectionErr, collection) ->
    checkError collectionErr, errorFn, ->
      try
        collection.update criteria, objNew, options, () ->
          db.close()
          callback.apply this, arguments
      catch e
        console.trace e
        callback e if callback?
      

repository::remove = (criteria, callback = ->) ->
  throw 'Criteria is empty' if Object.keys(criteria).length is 0
  
  db = getDb()
  errorFn = errorHandler db, callback
  
  @getCollection db, (collectionErr, collection) ->
    checkError collectionErr, errorFn, ->
      collection.remove criteria
      callback()    
    

exports.repository = repository
        
