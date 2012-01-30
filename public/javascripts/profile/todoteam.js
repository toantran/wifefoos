var noteam = {
    createteamclick: function(e) {
      $('#todo-noteam-create.dialog').dialog('open');
      e.preventDefault();
    },
    
    createTeam: function(teamName, callback) {
      var postUrl = $('form#form-teamcreate').attr('action');
      $.post(postUrl, { teamname: teamName})
      .success( function(opts, status, res) {
        callback();
      })
      .error( function(res, status) {
        callback(status);
      });
    },
    
    createteamsubmit: function() {
      var teamName = $('input#form-teamcreate-teamname').val();
      
      if ( !teamName) { // empty
        $('input#form-teamcreate-teamname').addClass('error');
      } else {        
        noteam.createTeam(teamName, function(error) {
          if (error) {
            console.log(error);
          } else {
            $('#todo-noteam-create.dialog').dialog('close');
            window.location.href = window.location.href;
          }
        });
      }
    },
    
    createteamcancel: function() {
      $('#todo-noteam-create.dialog').dialog('close');
    },
    
    jointeamclick: function(e) {
      $('#todo-noteam-join.dialog').dialog('open');
      e.preventDefault();
    },    
    
    jointeamsubmit: function() {
      $('#todo-noteam-join.dialog').dialog('close');
    },
    
    jointeamcancel: function() {
      $('#todo-noteam-join.dialog').dialog('close');
    },
    
    jointeamopen: function() {
      $('#todo-noteam-join .team-list').empty();
      
      noteam.loadAvailableTeams();
    },
    
    loadAvailableTeams: function() {
      $.get('/team', {available: true})
      .success( function(data, status, res) {
        noteam.populateTeams(data);
      } )
      .error( function(res, status) {
        console.log('failed ', status, res);
      } );
    },
    
    populateTeams: function(teams) {
      var $list = $('#todo-noteam-join .team-list');
      
      for (var i=0; i < teams.length; i++) {
        var team = teams[i]
          , html = ['<div class="team-info">'
                    , '<div class="team-picture"><img src="{0}"></div>'
                    , '<div class="team-detail">'
                      , '<div class="team-name">{1}</div>'
                      , '<div class="team-creator" userid="{2}">Team member: {3}</div>'
                    , '</div>'
                    , '<div class="team-record">'
                      , '<a class="team-join-button" teamid="{4}">Join</a>'
                    , '</div>'
                    , '<div class="clear-float"></div>'
                    , '</div>'].join('');

        html = html.replace('{0}', team.pictureurl || '/images/the-a-team.jpg')
                  .replace('{1}', team.teamname || 'No name')                  
                  .replace('{2}', team.members[0])
                  .replace('{4}', team._id);
                    
        if (team && team.members && team.members.length) {
          var jqxhr = $.get('/profile/' + team.members[0] + '.json')
                      .success( function(data, status, res) {                      
                        
                        html = html.replace('{3}', data.nickname);
                        $list.append(html);
                      } );                                                          
        } else {
          html = html.replace('{3}', '');
          $list.append(html);
        }
      }
    },
    
    jointeambtnclick: function(e) {
      var teamid = $(e.target).attr('teamid')
        , userid = $('#todo-noteam-join.dialog').attr('userid');
      
      teamid = $.trim(teamid);
      userid = $.trim(userid);
      if (teamid) {
        $.post('/player/jointeam', {
          userid: userid
          , teamid: teamid
          , format: 'json'
        })
        .success(function(data, status, res) {
          console.log()
          $('#todo-noteam-join.dialog').dialog('close');
          $('#todo-noteam-join-confirm.dialog').dialog('open');
        })
        .error(function(res, status) {
          console.log(status);
        });        
      }
    },
    
    seeteambtnclick: function() {
      var teamid = $( this ).attr('teamid');
      window.location.href = '/team/' + teamid;
    }
};


$( function() {
  // render buttons
  $('.todo-noteam button').button();
  
  // render create team dialog
  $('#todo-noteam-create.dialog').dialog({
    autoOpen: false
    , height: 280
    , width: 500
    , modal: true
    , resizable: true
    , show: 'drop'
    , hide: 'explode'
    , buttons: {
      Create: noteam.createteamsubmit
      , Cancel: noteam.createteamcancel
    }
  });
  
  // render join team dialog
  $('#todo-noteam-join.dialog').dialog({
    autoOpen: false
    , height: 400
    , width: 500
    , modal: true
    , resizable: true
    , show: 'drop'
    , hide: 'explode'
    , open: noteam.jointeamopen
    , buttons: {
      Cancel: noteam.jointeamcancel
    }
  });
  
  // render join request sent confirmation dialog
  $('#todo-noteam-join-confirm.dialog').dialog({
    autoOpen: false
    , height: 170
    , width: 320
    , modal: true
    , resizable: false
    , show: 'slide'
    , hide: 'explode'
    , buttons: {
      OK: function() {
        $( this ).dialog('close');
      }
    }  
  });
  
  $('.todo-noteam button#createteambtn').click( noteam.createteamclick );
  $('.todo-noteam button#jointeambtn').click( noteam.jointeamclick );
  $('.todo-noteam button#gototeambtn').click( noteam.seeteambtnclick );
  $('#todo-noteam-join.dialog .team-record a').live('click', noteam.jointeambtnclick);
  $('input#form-teamcreate-teamname').focus( function() { $(this).removeClass('error')});
});
