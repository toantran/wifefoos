var profile = {
  accceptinviteclick: function(e) {
    var $button = $(e.currentTarget) 
      , teamid = $button.attr('teamid')
      , userid = $button.attr('userid');
    
    $.post('/player/acceptinvite', {userid: userid, teamid: teamid})
    .success( function() {
      window.location.href = window.location.href;
    })
    .error( function(res, status) {} );
  }
};

$(document).ready( function() {

  $('.todo-invite button').button();
console.log(  $('.todo-invite button') );
  $('.todo-invite button').click(profile.accceptinviteclick);
  //$('input#createteambtn').click(profile.createTeamClick);  
  
  //$('input#recruitbtn').click(profile.recruitClick);
  
} );


