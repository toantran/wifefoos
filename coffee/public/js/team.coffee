jQuery ($) ->
  makethis = -> @
    
  global = makethis.call()
  global.setActiveMenu 1
  
  ids = {}
  
  $('#team-challenge-dlg').modal 
    backdrop: true
    keyboard: true
    show: false
    
  $('#team-joining-dlg').modal
    backdrop: false
    keyboard: true
    show: false
    
  $('#team-challenge-sent-dlg').modal
    backdrop: true
    keyboard: true
    show: false
    
  $('#team-challenge-dlg').on 'show', ->
    $('#team-challenge-dlg .alert-container').empty()
    
  $('button.btn.btn-danger').on 'click', ->
    ids.challengerid = $(@).attr('challengerid')
    ids.challengeeteamid = $(@).attr('challengeeteamid')
    $('#team-challenge-dlg').modal 'show'
    
  $('button.btn.btn-success').on 'click', ->
    teamid = $(@).attr('data-teamid')
    playerid = $(@).attr('data-playerid')
    $.post("/team/#{teamid}/join", playerid: playerid)
    .success (data) ->
      $('#team-joining-dlg').modal 'show'
      
    
  $('#team-challenge-dlg a.btn.btn-primary').on 'click', ->    
    values = ids
    form = $('form#team-challenge-form')
    $.each form.serializeArray(), (i, field) ->
        values[field.name] = field.value
    
    $.post('/team/challenge', values)
    .success (data) ->
      if data.success
        $('#team-challenge-dlg').modal 'hide'
        $('#team-challenge-sent-dlg').modal 'show'
      else
        $('#team-challenge-dlg .alert-container')
        .empty()
        .append '<div class="alert alert-error"><a class="close" data-dismiss="alert">x</a><h4>Error!</h4>' + data.error + '</div>'
  
  $('#team-challenge-sent-dlg a.btn.btn-primary').on 'click', ->
    $.publish 'Challenge', 'Blah blah blah'
    
###
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
    
    $.each(form.serializeArray(), function(i, field) {
        values[field.name] = field.value;
    });
    
    $.post('/team/challenge', values)
    .success( function(data) {
      if (data && data.success) {
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
      } else {
        $('<div>You have already challenged this team.</div>').dialog({
          modal: true        
          , title: 'Challenge'
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
      }  
    })
    .error( function(res, status) {
    });
  }  
};
###


