(function() {

  jQuery(function($) {
    var global, ids, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    global.setActiveMenu(1);
    ids = {};
    $('#team-challenge-dlg').modal({
      backdrop: true,
      keyboard: true,
      show: false
    });
    $('#team-joining-dlg').modal({
      backdrop: false,
      keyboard: true,
      show: false
    });
    $('#team-challenge-sent-dlg').modal({
      backdrop: true,
      keyboard: true,
      show: false
    });
    $('#team-challenge-dlg').on('show', function() {
      return $('#team-challenge-dlg .alert-container').empty();
    });
    $('button.btn.btn-danger').on('click', function() {
      ids.challengerid = $(this).attr('challengerid');
      ids.challengeeteamid = $(this).attr('challengeeteamid');
      return $('#team-challenge-dlg').modal('show');
    });
    $('button.btn.btn-success').on('click', function() {
      var playerid, teamid;
      teamid = $(this).attr('data-teamid');
      playerid = $(this).attr('data-playerid');
      return $.post("/team/" + teamid + "/join", {
        playerid: playerid
      }).success(function(data) {
        return $('#team-joining-dlg').modal('show');
      });
    });
    $('#team-challenge-dlg a.btn.btn-primary').on('click', function() {
      var form, values;
      values = ids;
      form = $('form#team-challenge-form');
      $.each(form.serializeArray(), function(i, field) {
        return values[field.name] = field.value;
      });
      return $.post('/team/challenge', values).success(function(data) {
        if (data.success) {
          $('#team-challenge-dlg').modal('hide');
          return $('#team-challenge-sent-dlg').modal('show');
        } else {
          return $('#team-challenge-dlg .alert-container').empty().append('<div class="alert alert-error"><a class="close" data-dismiss="alert">x</a><h4>Error!</h4>' + data.error + '</div>');
        }
      });
    });
    return $('#team-challenge-sent-dlg a.btn.btn-primary').on('click', function() {
      return $.publish('Challenge', 'Blah blah blah');
    });
  });

}).call(this);
