(function() {

  jQuery(function($) {
    var onbuttonclick;
    onbuttonclick = function() {
      var btn, btnVal, data, otherteamid, teamid, url,
        _this = this;
      btnVal = $(this).attr('value');
      teamid = $(this).attr('data-teamid');
      otherteamid = $(this).attr('data-otherteamid');
      btn = $(this);
      switch (btnVal) {
        case 'accept':
          url = '/team/challengeaccept';
          data = {
            challengingteamid: otherteamid,
            challengedteamid: teamid
          };
          break;
        case 'decline':
          url = '/team/challengedecline';
          data = {
            challengingteamid: otherteamid,
            challengedteamid: teamid
          };
          break;
        case 'cancel':
          url = '/team/challengecancel';
          data = {
            challengingteamid: teamid,
            challengedteamid: otherteamid
          };
      }
      return $.post(url, data).success(function(resp) {
        if (resp != null ? resp.success : void 0) {
          return $(btn).closest('.alert').alert('close');
        }
      });
    };
    return $('button').on('click', onbuttonclick);
  });

}).call(this);
