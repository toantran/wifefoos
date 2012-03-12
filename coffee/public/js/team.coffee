jQuery ($) ->
  makethis = -> @
    
  global = makethis.call()
  global.setActiveMenu 1
  
  ids = {}
  
  $('#team-challenge-dlg').modal 
    backdrop: true
    keyboard: true
    show: false
    
  $('#team-joining-dlg').modal
    backdrop: false
    keyboard: true
    show: false
    
  $('#team-challenge-sent-dlg').modal
    backdrop: true
    keyboard: true
    show: false
    
  $('#team-challenge-dlg').on 'show', ->
    $('#team-challenge-dlg .alert-container').empty()
    
  $('button.btn.btn-danger').on 'click', ->
    ids.challengerid = $(@).attr('challengerid')
    ids.challengeeteamid = $(@).attr('challengeeteamid')
    $('#team-challenge-dlg').modal 'show'
    
  $('button.btn.btn-success').on 'click', ->
    teamid = $(@).attr('data-teamid')
    playerid = $(@).attr('data-playerid')
    $.post("/team/#{teamid}/join", playerid: playerid)
    .success (data) ->
      $('#team-joining-dlg').modal 'show'
      
    
  $('#team-challenge-dlg a.btn.btn-primary').on 'click', ->    
    values = ids
    form = $('form#team-challenge-form')
    $.each form.serializeArray(), (i, field) ->
        values[field.name] = field.value
    
    $.post('/team/challenge', values)
    .success (data) ->
      if data.success
        $('#team-challenge-dlg').modal 'hide'
        $('#team-challenge-sent-dlg').modal 'show'
      else
        $('#team-challenge-dlg .alert-container')
        .empty()
        .append '<div class="alert alert-error"><a class="close" data-dismiss="alert">x</a><h4>Error!</h4>' + data.error + '</div>'
  
  $('#team-challenge-sent-dlg a.btn.btn-primary').on 'click', ->
    $.publish 'Challenge', 'Blah blah blah'    

