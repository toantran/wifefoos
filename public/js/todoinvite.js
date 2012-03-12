(function() {

  jQuery(function($) {
    var accceptinviteclick;
    accceptinviteclick = function(e) {
      var teamid, userid;
      teamid = $(this).attr('data-teamid');
      userid = $(this).attr('data-userid');
      return $.post('/player/acceptinvite', {
        userid: userid,
        teamid: teamid
      }).success(function(data) {
        return window.location.href = window.location.href;
      }).error(function(res, status) {});
    };
    return $('.todo-invite a.btn-primary').on('click', accceptinviteclick);
  });

}).call(this);
