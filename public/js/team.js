(function() {

  jQuery(function($) {
    var global, ids, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    global.setActiveMenu(1);
    ids = {};
    $('#team-challenge-dlg').modal({
      backdrop: true,
      keyboard: true,
      show: false
    });
    $('#team-joining-dlg').modal({
      backdrop: false,
      keyboard: true,
      show: false
    });
    $('#team-challenge-sent-dlg').modal({
      backdrop: true,
      keyboard: true,
      show: false
    });
    $('#team-challenge-dlg').on('show', function() {
      return $('#team-challenge-dlg .alert-container').empty();
    });
    $('button.btn.btn-danger').on('click', function() {
      ids.challengerid = $(this).attr('challengerid');
      ids.challengeeteamid = $(this).attr('challengeeteamid');
      return $('#team-challenge-dlg').modal('show');
    });
    $('button.btn.btn-success').on('click', function() {
      var playerid, teamid;
      teamid = $(this).attr('data-teamid');
      playerid = $(this).attr('data-playerid');
      return $.post("/team/" + teamid + "/join", {
        playerid: playerid
      }).success(function(data) {
        return $('#team-joining-dlg').modal('show');
      });
    });
    $('#team-challenge-dlg a.btn.btn-primary').on('click', function() {
      var form, values;
      values = ids;
      form = $('form#team-challenge-form');
      $.each(form.serializeArray(), function(i, field) {
        return values[field.name] = field.value;
      });
      return $.post('/team/challenge', values).success(function(data) {
        if (data.success) {
          $('#team-challenge-dlg').modal('hide');
          return $('#team-challenge-sent-dlg').modal('show');
        } else {
          return $('#team-challenge-dlg .alert-container').empty().append('<div class="alert alert-error"><a class="close" data-dismiss="alert">x</a><h4>Error!</h4>' + data.error + '</div>');
        }
      });
    });
    return $('#team-challenge-sent-dlg a.btn.btn-primary').on('click', function() {
      return $.publish('Challenge', 'Blah blah blah');
    });
  });

  /*
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
  */

}).call(this);
