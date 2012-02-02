var team = {
  
  challengedialog: null
   
  , poplateMemberNames: function() {
    $('.member-list .member-name').each( team.populateMember );
  }
  
  
  , populateMember: function(index, nameEl) {
    var userid = $(nameEl).attr('memberid');
   
    if (userid) {
      $.get('/profile/' + userid + '.json')
      .success( function(data) {
        var html = '<a href="/profile/' + userid + '">' + data.nickname + '</a>';
        
        $(nameEl).empty();
        $(nameEl).append(html);
      });
    }
  }
  
  , challengebtnclick: function(e) {
    var challengerid= $(this).attr('challengerid')
      teamid = $(this).attr('challengeeteamid');
    
    team.challengedialog.ajaxdata = {
      challengerid: challengerid
      , teamid: teamid 
    };
    
    team.challengedialog.dialog('open');
  }  
  
  , challengeopen: function() {
      
  }
  
  , challengesendclick: function(e) {
    var values = team.challengedialog.ajaxdata
      , form = $('form#team-challenge-form');    
    
    console.log(form, form.serializeArray());
    $.each(form.serializeArray(), function(i, field) {
        console.log(i, field);
        values[field.name] = field.value;
    });
    
    $.post('/team/challenge', values)
    .success( function(data) {
      $('<div style="font-size: 20px; color: red;"><img src="/images/challenge2.jpg" width=100px height=100px">Challenge sent!</div>').dialog({
        modal: true        
        , title: 'Sent'
        , stack: true
        , close: function() {
          team.challengedialog.dialog('close');        
        }
        , buttons: {
          OK: function() {
            $(this).dialog('close');
          }
        }
      });      
    })
    .error( function(res, status) {
      console.log(status);    
    });
  }  
};

$( function() {
  // render buttons
  $('.team-buttons a').button();
  $('.team-buttons a').click( team.challengebtnclick);
  
  // populate member names
  team.poplateMemberNames();
  
  // render challenge dialog
  team.challengedialog = $('#team-challenge.dialog');
  team.challengedialog.dialog({
    autoOpen: false
    , height: 400
    , width: 500
    , modal: true
    , resizable: true
    , show: 'drop'
    , hide: 'explode'
    , open: team.challengeopen
    , buttons: {
      Send: team.challengesendclick
      , Cancel: function() { team.challengedialog.dialog('close') }
    }
  });
});
