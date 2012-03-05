(function() {

  jQuery(function($) {
    var _this = this;
    return $('form#password-recover-form').submit(function(e) {
      var email;
      email = $('input#form-login-username').val();
      $.post('/account/recover', {
        email: email
      }).success(function(data) {
        if (data != null ? data.success : void 0) {
          return $('<div>A reset password instruction email has been sent to your email account.</div>').dialog({
            autoOpen: true,
            buttons: {
              'Ok': function() {
                return $(this).dialog('close');
              }
            }
          });
        } else {
          return $("<div>An error has occurred while trying to send your reset password email.  Please try again later.</div>").dialog({
            autoOpen: true,
            buttons: {
              'Ok': function() {
                return $(this).dialog('close');
              }
            }
          });
        }
      });
      return false;
    });
  });

}).call(this);
