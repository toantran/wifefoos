
var nomate = {
  
  recruitbtnclick: function(e) {
    nomate.playerform.dialog('open');
  },
  
  
  recruitcancel: function() {
    $( this ).dialog('close');
  },
  
  
  playerformopen: function() {
    $('#todo-nomate-recruit #player-list').empty();
    nomate.loadAvailablePlayers();
  },
  
  
  loadAvailablePlayers: function() {
    $.get('/player', { available: true })
    .success( function(data, status, res) {
      noteam.populatePlayers(data);
    })
    .error( function(res, status) {
      console.log('failed ', status, res);
    });
  },
  
  
  populatePlayers: function(players) {
  
  }
};

$( function() {

  nomate.playerform = $('#todo-nomate-recruit.dialog');  
  
  // render buttons
  $('.todo-nomate button').button();
  
  // render dialog
  nomate.playerform.dialog({
    autoOpen: false
    , height: 400
    , width: 500
    , modal: true
    , resizable: true
    , show: 'drop'
    , hide: 'explode'
    , open: nomate.playerformopen
    , buttons: {
      Cancel: nomate.recruitcancel
    }
  });
  
  // assign button handlers
  $('button#recruitbtn').click( nomate.recruitbtnclick );
} );
