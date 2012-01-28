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
                    , '<div class="team-detail team-picture"><img src="{0}"></div>'
                    , '<div class="team-detail team-name">{1}</div>'
                    , '<div class="team-detail team-creator" userid="{2}">Team creator</div>'
                    , '<div class="clear-float"></div>'
                    , '</div>'].join('');
        html = html.replace('{0}', team.pictureurl || '/images/the-a-team.jpg')
                  .replace('{1}', team.teamname || 'No name')
                  .replace('{2}', team.members[0]);
        $list.append(html);
      }
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
      Join: noteam.jointeamsubmit
      , Cancel: noteam.jointeamcancel
    }
  });
  
  
  $('.todo-noteam button#createteambtn').click( noteam.createteamclick );
  $('.todo-noteam button#jointeambtn').click( noteam.jointeamclick );  
  
  $('input#form-teamcreate-teamname').focus( function() { $(this).removeClass('error')});
});
