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
    var actionType = $(this).attr('value')
      , url = ''
      , postdata = {
        challengingteamid : $(this).attr('challengingteamid')
        , challengedteamid : $(this).attr('challengedteamid')        
      }
      , sendchallengeaction = function( url, data) {
        if (url) {
          $.post(url, data)
          .success( function(data) {
            window.location.href = window.location.href;
          })
          .error( function( res, status) {
          
          });
        }
      };
    
    switch (actionType) {
      case 'cancel':
        url = '/team/challengecancel';
        break;
      case 'accept':
        url = '/team/challengeaccept';
        break;
      case 'decline':
        url = '/team/challengedecline';
        break;
      default:
        break;        
    }
    
    sendchallengeaction(url, postdata);
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
          text += ' with message "' + data.message + '"';
        }               
      }
      
      $(el).find('.team-challenge-text').append(text);
      
    })
    .error( function(res, status) {
    });
  }   
  
  , loadchallenging: function(index, el) {
    var challengingteamid = $(el).attr('challengingteamid')
      , challengedteamid = $(el).attr('challengedteamid');
      
    $.get('/team/challenge', {
      teamid: challengingteamid
      , challengerid: challengedteamid
    })
    .success( function(data) {
      var text = 'You have challenged team <a href="/team/{0}">{1}</a>';
      
      if (data) {
        text = text.replace('{0}', data.teamid)
                  .replace('{1}', data.team.teamname);
        
        if (data.matchtype) {
          text += ' in ' + profile.matchtypetext(data.matchtype);
        }
        
        if (data.message) {
          text += ' with message "' + data.message + '"';
        }               
      }
      
      $(el).find('.team-challenge-text').append(text);
      
    })
    .error( function(res, status) {
    });
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
  
  
  , updateresultclick: function(e) {
    var btn = $(this)
      , matchid = btn.attr('matchid')
      , teamid = btn.attr('teamid')
      , playerid = btn.attr('playerid')
      , action = btn.attr('action');
    
    $.ajax({
      url: '/match/' + matchid
      , type: 'PUT'
      , data: {
        teamid: teamid
        , playerid: playerid
        , result: action
      }
      , success: function(data) {
        window.location.href = window.location.href;
      }
    });
    
    /*
    $.put('/match/' + matchid, {
      teamid: teamid
      , playerid: playerid
      , result: action
    })
    .success( function(data) {
      console.log(data);
    });
    */
  }
  
  
  , newpostclick: function(e) {
    var profileid = $(this).attr('profileid')
      , userid = $(this).attr('userid')
      , msg = $('#newpost-msg').val();
    
    if (msg) {  // has a post
      $.post('/profile/' + profileid + '/addpost', {
        posterid: userid
        , msg: msg
      })
      .success( function(data) {
        console
        if (data && data.success) {
          var html = profile.renderpost(data.post, profileid, userid);
          var el = $(html).prependTo('.post-list')
                           .show('slow');
                           
          el.find('.post-new-comment textarea')
            .watermark('Write something...')
            .elastic();
          el.find('.post-new-comment button').button();
          el.find('.post-new-comment button').click(profile.newcommentclick);
          $('#newpost-msg').val('');
        }
      });
    }
    
  }
  
  
  , renderpost: function(post, profileid, userid) {
    var posttemplate = ['<div postid="{0}" class="post-panel" style="display: none;">'
                          , '<a class="post-close-btn"></a>'
                          , '<div class="poster-picture">{1}</div>'
                          , '<div class="post-item">'
                            , '{2}'
                            , '<div class="postmark">{3}</div>'
                            , '<div class="post-comment-list">'
                              , '<div class="post-new-comment">'
                                , '<textarea class="post-text" cols=62/>'
                                , '<button postid="{4}" profileid="{5}" posterid="{6}">Post</button>'
                              , '</div>'
                            , '</div>'
                          , '</div>'
                          , '<div class="clear-float"></div>'
                        , '</div>'].join('');
                        
    if (!post) { return ''; }
    
    posttemplate = posttemplate.replace('{0}', post.id)
                              .replace('{4}', post.id)
                              .replace('{1}', post.pictureurl ? '<img src=\'' + post.pictureurl + '\'/>': '')
                              .replace('{2}', post.desc)
                              .replace('{5}', profileid)
                              .replace('{6}', userid);
                              
    var d = new Date(post.createdat);                          
    posttemplate = posttemplate.replace('{3}', 'on ' + d.toString());
    
    return posttemplate;
  }
  
  
  , postmouseover: function(e) {
    $(this).addClass('post-active');
  }
  
  
  , postmouseout: function(e) {
    $(this).removeClass('post-active');
  }
  
  , postremoveclick: function(e) {
    var postpnl = $(this).closest('.post-panel')
      , profileid = postpnl ? $(postpnl).attr('profileid') : null
      , postid = postpnl ? $(postpnl).attr('postid') : null;
    
    if (postid && profileid) {
      $.post('/profile/' + profileid + '/removepost', {postid: postid})
      .success( function(data) {
        $(postpnl).hide('slow');
      });
    }
    
    $(postpnl).hide('slow');
  }
  
  
  , postcommentfocus: function(e) {
    var parent = $(this).closest('.post-new-comment');
    
    $(parent).addClass('post-active');
  }
  
  
  , postcommentblur: function(e) {
    var parent = $(this).closest('.post-new-comment');
    
    if (!$(this).val()) {
      $(parent).removeClass('post-active');
    }
  }
  
  , newcommentclick: function(e) {
    var parent = $(this).closest('.post-new-comment')
      , inputs = $(parent).find('textarea.post-text')
      , msg = (inputs && inputs.length) ? $(inputs[0]).val() : ''
      , profileid = $(this).attr('profileid')
      , postid = $(this).attr('postid')
      , posterid = $(this).attr('posterid');
        
    console.log(msg , profileid , posterid , postid);
    if (msg && profileid && posterid && postid) {
      $.post('/profile/' + profileid + '/addcomment', {
        postid: postid
        , posterid: posterid
        , msg: msg
      })
      .success( function(data) {
        console.log(data);
      });
      
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
  $('.match-update-panel button').button();
  $('.match-update-panel button').click( profile.updateresultclick);
  $('#personal-wall button').button();
  $('.new-post button').click( profile.newpostclick );
  $('.post-list').on('mouseover', '.post-panel', profile.postmouseover);
  $('.post-list').on('mouseout', '.post-panel', profile.postmouseout);
  $('.post-list').on('click', 'a.post-close-btn', profile.postremoveclick);
  $('.post-list').on('focus', '.post-new-comment textarea', profile.postcommentfocus);
  $('.post-list').on('blur', '.post-new-comment textarea', profile.postcommentblur);  
  $('#newpost-msg').watermark('Write a new post...')
                  .elastic();
  $('.post-new-comment textarea').watermark('Write something...', 'watermark')
                                .elastic();
  $('.post-new-comment button').click( profile.newcommentclick );                              
                                
} );


