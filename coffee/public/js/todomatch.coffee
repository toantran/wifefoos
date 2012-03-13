jQuery ($) ->
  
  onresultbtnclick = ->
    matchid = $(@).attr 'data-matchid'
    teamid = $(@).attr 'data-teamid'
    playerid = $(@).attr 'data-playerid'
    vote = $(@).attr 'data-vote'
    
    $.ajax
      url: '/match/' + matchid
      type: 'PUT'
      data: 
        teamid: teamid
        playerid: playerid
        result: vote
      success: (data) ->
        window.location.href = window.location.href
    
  $('.todo-match button').on 'click', onresultbtnclick
