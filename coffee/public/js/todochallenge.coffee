jQuery ($) ->
  
  onbuttonclick = ->
    btnVal =  $(@).attr 'value'
    teamid = $(@).attr 'data-teamid'
    otherteamid = $(@).attr 'data-otherteamid'
    btn = $(@)
    
    switch btnVal
      when 'accept'
        url = '/team/challengeaccept'
        data = challengingteamid: otherteamid, challengedteamid: teamid
      when 'decline'
        url = '/team/challengedecline'
        data = challengingteamid: otherteamid, challengedteamid: teamid
      when 'cancel'
        url = '/team/challengecancel'
        data = challengingteamid: teamid, challengedteamid: otherteamid
    
    $.post(url, data)
    .success (resp) =>
      if resp?.success
        $(btn).closest('alert').alert 'close'
      
  $('button').on 'click', onbuttonclick


