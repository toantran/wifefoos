jQuery ($) ->
  
  oncreateteamclick = ->
    profileid = $(@).attr 'data-profileid'
    values = 
      profileid: profileid
    form = $('form#form-teamcreate')
    $.each form.serializeArray(), (i, field) ->
        values[field.name] = field.value
        
    $.post("/team/#{profileid}", values)
    .success (data) ->
      $(@).closest('modal').modal 'hide'
      $('.todo-noteam.alert').hide()
      window.location.href = window.location.href    
    
  
  $('#todo-noteam-create a.btn.btn-primary').on 'click', oncreateteamclick
