var profile = function() {
  
};

profile.createTeamClick = function(e) {
  var userId = $(e.target).attr('profileid') || '0';
  window.location.href = '/team/' + userId +'/add';
};


profile.recruitClick = function(e) {
  console.log();
};


$(document).ready( function() {

  //$('input#createteambtn').click(profile.createTeamClick);  
  
  //$('input#recruitbtn').click(profile.recruitClick);
  
} );


