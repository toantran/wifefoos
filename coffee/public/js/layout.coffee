jQuery ($) ->
  makethis = -> @
    
  global = makethis.call()
  global.setActiveMenu = (menuIndex) ->
    $('ul.nav > li').removeClass 'active'
    $($('ul.nav > li')[menuIndex]).addClass 'active'
