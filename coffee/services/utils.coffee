
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
