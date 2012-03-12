jQuery ($) ->
  accceptinviteclick= (e) ->
    teamid = $(@).attr('data-teamid')
    userid = $(@).attr('data-userid')
    
    $.post('/player/acceptinvite', {userid, teamid})
    .success (data) ->
      window.location.href = window.location.href
    .error  (res, status) ->
  
  
  $('.todo-invite a.btn-primary').on 'click', accceptinviteclick
