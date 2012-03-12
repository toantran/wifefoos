(function() {

  jQuery(function($) {
    var oncreateteamclick;
    oncreateteamclick = function() {
      var form, profileid, values;
      profileid = $(this).attr('data-profileid');
      values = {
        profileid: profileid
      };
      form = $('form#form-teamcreate');
      $.each(form.serializeArray(), function(i, field) {
        return values[field.name] = field.value;
      });
      return $.post("/team/" + profileid, values).success(function(data) {
        $(this).closest('modal').modal('hide');
        $('.todo-noteam.alert').hide();
        return window.location.href = window.location.href;
      });
    };
    return $('#todo-noteam-create a.btn.btn-primary').on('click', oncreateteamclick);
  });

}).call(this);
