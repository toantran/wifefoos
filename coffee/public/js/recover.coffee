jQuery ($) ->
  $('form#password-recover-form').submit (e) =>
    email = $('input#form-login-username').val()
    
    $.post('/account/recover', {email: email})
    .success (data) ->
      if data?.success
        $('<div>A reset password instruction email has been sent to your email account.</div>')
        .dialog
          autoOpen: true
          buttons: 
            'Ok': ->
              $(@).dialog 'close'
      else
        $("<div>An error has occurred while trying to send your reset password email.  Please try again later.</div>")
        .dialog
          autoOpen: true
          buttons: 
            'Ok': ->
              $(@).dialog 'close'
    
    return false;
