jQuery ($) ->
  makethis = -> @
    
  global = makethis.call()
  
  $.publish = (title, body) ->
      console.log title, body
