
exports.map = (array = [], asyncMapFn, callback) ->
  counter = array.length
  new_array = []
  runit = (item, index) ->
    asyncMapFn item, (err, result) ->
      if err
        callback err
      else
        new_array[index] = result
        counter--
        if counter is 0
          callback null, new_array
  
  runit item, index for item, index in array
    
    
exports.mapAsync = (array = [], asyncMapFn, callback) ->
  counter = array.length
  new_array = []
  runit = (item, index) ->
    asyncMapFn item, (err, result) ->
      if err
        callback err
      else
        new_array[index] = result
        counter--
        if counter is 0
          callback null, new_array
  
  runit item, index for item, index in array
      

exports.parallel = ( fnArray = [], callback) ->
  counter = fnArray.length
  resultArray = []
  runit = (fn, index) ->
    fn (err, result) ->
      if err
        callback err
      else
        resultArray[index] = result
        counter--
        if counter is 0
          callback null, resultArray
  
  runit fn, index for fn, index in fnArray
  
  
exports.seriesAsync = (fnArray = [], initVal, callback = ->) ->
  fns = fnArray.slice()
  val = initVal
  next = (prevErr, prevVal) ->
    return callback(prevErr) if prevErr?
    fn = fns.shift()
    if fn? and typeof fn is 'function'
      fn prevVal, next 
    else
      callback prevErr, prevVal
      
  next null, val
  
  
exports.throwIfNull = () ->
  
  
  
  
      
