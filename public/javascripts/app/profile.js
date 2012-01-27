var profile = function() {
  
};

profile.createTeamClick = function(e) {
  var userId = $(e.target).attr('profileid') || '0';
  window.location.href = '/team/' + userId +'/add';
};


$(document).ready( function() {

  $('input#createteambtn').click(profile.createTeamClick);  
  
} );


