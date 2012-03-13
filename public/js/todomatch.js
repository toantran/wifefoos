(function() {

  jQuery(function($) {
    var onresultbtnclick;
    onresultbtnclick = function() {
      var matchid, playerid, teamid, vote;
      matchid = $(this).attr('data-matchid');
      teamid = $(this).attr('data-teamid');
      playerid = $(this).attr('data-playerid');
      vote = $(this).attr('data-vote');
      return $.ajax({
        url: '/match/' + matchid,
        type: 'PUT',
        data: {
          teamid: teamid,
          playerid: playerid,
          result: vote
        },
        success: function(data) {
          return window.location.href = window.location.href;
        }
      });
    };
    return $('.todo-match button').on('click', onresultbtnclick);
  });

}).call(this);
