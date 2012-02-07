
var nomate = {
  
  recruitbtnclick: function(e) {
    nomate.playerlistdialog.dialog('open');
  },
  
  
  recruitcancel: function() {
    $( this ).dialog('close');
  },
  
  
  playerlistdialogopen: function() {
    $('#todo-nomate-recruit #player-list').empty();
    nomate.loadAvailablePlayers();
  },
  
  
  loadAvailablePlayers: function() {
    $.get('/player', { available: true })
    .success( function(data, status, res) {
      nomate.populatePlayers(data);
    })
    .error( function(res, status) {
    });
  },
  
  
  populatePlayers: function(players) {
    var $list = $('#todo-nomate-recruit #player-list')
      , teamid = nomate.playerlistdialog.attr('teamid')
      , userid = nomate.playerlistdialog.attr('userid');
     
    for (var i=0; i < players.length; i++) {
      var player = players[i]
        , html = ['<div class="player-info">'
                  , '<div class="player-detail picture">'
                    , '<img src="{0}">'
                  , '</div>'
                  , '<div class="player-detail info">'
                    , '<div class="nickname">'
                      , '<a href="/profile/{2}">{1}</a>'
                    , '</div>'
                  , '</div>'
                  , '<div class="buttons">'
                    , '<a class="team-invite-button" teamid="{4}" invitorid="{5}" inviteeid="{3}">Invite</a>'
                  , '</div>'
                  , '<div class="clear-float"/>'
                , '</div>'].join('');

      html = html.replace('{0}', player.pictureurl || '/images/player.jpg')
                .replace('{1}', player.nickname || 'No name')                  
                .replace('{2}', player._id)
                .replace('{3}', player._id)
                .replace('{4}', teamid)
                .replace('{5}', userid);
                        
      $list.append(html);
    }
  },
  
  
  inviteclick: function(e) {
    var $button = $(e.target)
      , teamid = $button.attr('teamid')
      , invitorid = $button.attr('invitorid')      
      , inviteeid = $button.attr('inviteeid');
      
    $.post('/player/invite', {
      teamid: teamid
      , playerid: inviteeid
      , invitorid: invitorid
    })
    .success( function(data, status, res) {
      nomate.playerlistdialog.dialog('close');
      window.location.href = window.location.href;
    })
    .error( function(res, status) {
    });
  }
};

$( function() {

  nomate.playerlistdialog = $('#todo-nomate-recruit.dialog');  
  
  // render buttons
  $('.todo-nomate button').button();
  
  // render dialog
  nomate.playerlistdialog.dialog({
    autoOpen: false
    , height: 400
    , width: 550
    , modal: true
    , resizable: true
    , show: 'drop'
    , hide: 'explode'
    , open: nomate.playerlistdialogopen
    , buttons: {
      Cancel: nomate.recruitcancel
    }
  });
  
  // assign button handlers
  $('button#recruitbtn').click( nomate.recruitbtnclick );
  $(document).on('click', '#todo-nomate-recruit.dialog .buttons a', '', nomate.inviteclick);
} );
