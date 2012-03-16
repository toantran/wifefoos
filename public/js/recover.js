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
          return $('#recover-ok-dlg').modal('show');
        } else {
          return $('#recover-failed-dlg').modal('show');
        }
      });
      return false;
    });
  });

}).call(this);
