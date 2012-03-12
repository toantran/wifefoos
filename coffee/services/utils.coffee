_mapAsync = (array = [], asyncMapFn, callback = ->) ->
  counter = array.length
  new_array = []
  errors = []
  runit = (item, index) ->
    asyncMapFn item, (err, result) ->
      if err
        errors.push err

      new_array[index] = result
      counter--
      if counter is 0
        callback errors.join(','), new_array
  
  runit item, index for item, index in array


exports.map = exports.mapAsync = _mapAsync
    

exports.parallel = ( fnArray = [], callback = ->) ->
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
  nullArgs = arg for arg in arguments when not arg?
  throw 'Null argument' if nullArgs? and nullArgs.length
  
  
taskWrapper = (@task) ->
  @next = null
  @done = false  
  
taskWrapper::callback = (err, result) ->
  @done = true
  if @next? and typeof @next is 'function'
    @wrapper ?= new taskWrapper @next
    @next.call null, err, result, @wrapper.callback.bind(@wrapper)
  else
    @taskErr = err
    @taskResult = result
  
taskWrapper::then = (@next) ->
  if @next? and typeof @next is 'function'
    @wrapper = new taskWrapper @next
    @next.call null, @taskErr, @taskResult, @wrapper.callback.bind(@wrapper) if @done
    return @wrapper      
    
    
exports.execute = (task, args...) ->
  wrapper = new taskWrapper task
  args.push wrapper.callback.bind(wrapper)
  task.apply null, args
  return wrapper;
  
  
  
  
  
      
