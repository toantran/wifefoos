var profile = {
  accceptinviteclick: function(e) {
    var $button = $(e.currentTarget) 
      , teamid = $button.attr('teamid')
      , userid = $button.attr('userid');
    
    $.post('/player/acceptinvite', {userid: userid, teamid: teamid})
    .success( function() {
      window.location.href = window.location.href;
    })
    .error( function(res, status) {} );
  }
  
  , challengebtnclick: function(e) {    
    console.log( $(this).attr('value') );
  }
  
  , loadchallenged: function(index, el) {
    var challengingteamid = $(el).attr('challengingteamid')
      , challengedteamid = $(el).attr('challengedteamid');
      
    $.get('/team/challenge', {
      teamid: challengedteamid
      , challengerid: challengingteamid
    })
    .success( function(data) {
      var text = 'Team <a href="/team/{0}">{1}</a> has challenged you';
      
      if (data) {
        text = text.replace('{0}', data.teamid)
                  .replace('{1}', data.team.teamname);
        
        if (data.matchtype) {
          text += ' in ' + profile.matchtypetext(data.matchtype);
        }
        
        if (data.message) {
          text += ' with message ' + data.message;
        }               
      }
      
      $(el).find('.team-challenge-text').append(text);
      
    })
    .error( function(res, status) {
    });
  }   
  
  , loadchallenging: function(index, el) {
  
  }
  
  , matchtypetext: function(type) {
    switch (type) {
      case '1': 
        return 'one game match';
      case '3':
        return 'best of 3 games match';
      case '5':
        return 'best of 5 games match';      
      case '99':
        return 'a death match';
      default:
        return type;
    }
  }
};

$(document).ready( function() {

  $('.todo-invite button').button();
  $('.todo-invite button').click(profile.accceptinviteclick);
  $('.team-challenge button').button();
  $('.team-challenge button').click( profile.challengebtnclick );
  $('.team-challenged').each( profile.loadchallenged );
  $('.team-challenging').each( profile.loadchallenging );
  
} );


