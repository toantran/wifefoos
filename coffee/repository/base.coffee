GLOBAL.DEBUG = true

root = global ? window

mongo = require 'mongodb'
{Db, ObjectID: ObjectId, Timestamp, Connection, Server} = mongo

dbName = 'wifefoosdb'
host = process.env['MONGO_NODE_DRIVER_HOST'] ? 'localhost'
port = process.env['MONGO_NODE_DRIVER_PORT'] ? Connection.DEFAULT_PORT
db_connector = new Db dbName, new Server(host, port, {}), native_parser:false

exports.Db = Db
exports.ObjectId = ObjectId
exports.Timestamp = Timestamp
exports.Connection = Connection
exports.Server = Server

utils = require '../services/utils'

###
exports.Db = Db
exports.ObjectId = ObjectId
exports.Timestamp = Timestamp
exports.Connection = Connection
exports.Server = Server
###


###
Default error handler
###
checkError = (error, errorFn, next = ->) ->
  if error?
    console.log error
    errorFn()
  else
    next()
  


###
Return a default error handler
###
errorHandler = errorHandler = (db, callback = ->) ->
  (error) ->
    try
      db.close()     if db?
    catch e
      console.trace e
    callback error



Repository = (@collectionName) ->
  

Repository::setCollectionName = (@collectionName) ->


Repository::getDb = (callback = ->) ->
  if root?.db?.state isnt 'connected'
    db_connector.open (err, db) =>
      root.db = db
      callback err, db
  else
    callback null, root.db


###
Return the default collection
###  
Repository::getCollection = (callback = ->) ->
  try
    utils.execute( utils.bind(@getDb, @) )
    .then (err, db, cb = ->) =>
      return callback(err) if err
      db?.collection @collectionName, callback
  catch e2
    console.trace e2
    callback e2

        
Repository::create = (doc, callback = ->) ->  
  console?.assert doc?, 'Doc cannot be null'
  throw 'doc null' unless doc?
  
  doc.createdat = new Date()
  
  utils.execute( utils.bind(@getCollection, @) )
  .then (err, collection, cb = ->) =>
    return callback err if err
    try
      collection?.insert doc, {safe: true}, callback
    catch e
      console.trace e
      callback e      


Repository::read = (findArgs..., callback = ->) ->
  
  utils.execute( utils.bind(@getCollection, @) )
  .then (err, collection, cb = ->) =>
    return callback(err) if err
    try
      cursor = collection?.find.apply collection, findArgs
      callback null, cursor
    catch e
      console.trace e
      callback e
        

Repository::getById = (docid, callback = ->) ->
  console?.assert docid? and docid isnt 'undefined', 'docid must be defined'
  throw 'Invalid id' unless docid? and docid isnt 'undefined'
  
  docid = new ObjectId(docid) if typeof docid is 'string'
  @read _id: docid, (readErr, cursor) =>    
    return callback( readErr ) if readErr
    cursor?.toArray (toArrayErr, docs) =>
      return callback(toArrayErr) if toArrayErr
      return callback('Not found') unless docs?.length
      callback null, docs[0]
      cursor.close()
      


Repository::update = (criteria, objNew, options = {}, callback ) ->
  options.safe ?= if callback? then true else false
  options.multi ?= true
  options.upsert ?= true
  options['new'] ?= true
  
  utils.execute( utils.bind(@getCollection, @) )
  .then (err, collection, cb = ->) =>
    return callback(err) if err
    try
      collection?.update criteria, objNew, options, callback
    catch e
      console.trace e
      callback e if callback?
        
        
Repository::save = (doc, callback = ->) ->
  console?.assert doc?, 'Doc must not be null'
  throw 'Empty doc' unless doc?
  
  utils.execute( utils.bind(@getCollection, @) )
  .then (err, collection, cb = ->) =>
    return callback(err) if err
    try
      collection?.save doc, {safe: true}, callback
    catch e
      console.trace e
      callback e
      

Repository::remove = (criteria, callback = ->) ->
  throw 'Criteria is empty' if Object.keys(criteria).length is 0
    
  utils.execute( utils.bind(@getCollection, @) )
  .then (err, collection, cb = ->) =>
    collection?.remove criteria
    callback()
    

exports.Repository = Repository
        
