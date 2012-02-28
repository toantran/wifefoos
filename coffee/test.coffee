
f1 = (name, cb) ->
  console.log 'running 1', name
  cb null, 'done 1'
  
f2 = (err, result, cb) ->
  console.log 'running 2', err, result
  cb null, 'done 2'
  
f3 = (err, result, cb) ->
  console.log 'running 3', err, result
  cb null, 'done 3'
  
utils = require './services/utils'  

utils.execute(f1, 'Toan').then(f2).then(f3)
