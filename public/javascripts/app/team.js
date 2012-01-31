var team = {
  
  poplateMemberNames: function() {
    $('.member-list .member-name').each( team.populateMember );
  },
  
  
  populateMember: function(index, nameEl) {
    var userid = $(nameEl).attr('memberid');
   
    if (userid) {
      $.get('/profile/' + userid + '.json')
      .success( function(data) {
        console.log(data);
        var html = '<a href="/profile/' + userid + '">' + data.nickname + '</a>';
        
        $(nameEl).empty();
        $(nameEl).append(html);
      });
    }
  }
};

$( function() {
  // render buttons
  $('.team-buttons a').button();
  
  // populate member names
  team.poplateMemberNames();
});
