jQuery ($) ->
  makethis = -> @
  
  makerow = (rec) ->
    return null if not rec?
    
    dt = new Date(rec.createdat)
    
    $.el('div.row',{}, [
      $.el('div.span3',{}, [dt.toLocaleDateString()]),
      $.el('div.span2',{}, ['vs ',
        $.el('a',{href: rec.teamid}, [rec.teamname]) 
      ]),
      $.el('div.span1',{}, [rec.result])
    ])
  
  onplayerrecordwindowshow = ->
    container = $(@).find '.records-container'
    playerid = $(@).attr 'data-playerid'
    
    $.get("/profile/#{playerid}/records")
    .success (data) ->
      if data?.success
        $(container).empty()
        data?.records?.sort (rec1, rec2) -> 
          dt1 = new Date(rec1?.createdat)
          dt2 = new Date(rec2?.createdat)
          dt2 - dt1
        rows = ( $(container).append makerow( rec ) for rec in data?.records)            
  
  $('#player-records-dlg').on 'show', onplayerrecordwindowshow
  
  
  onteamrecordwindowshow = ->
    container = $(@).find '.records-container'
    teamid = $(@).attr 'data-teamid'
    
    $.get("/team/#{teamid}/records")
    .success (data) ->
      if data?.success
        $(container).empty()
        data?.records?.sort (rec1, rec2) -> 
          dt1 = new Date(rec1?.createdat)
          dt2 = new Date(rec2?.createdat)
          dt2 - dt1
        rows = ( $(container).append makerow( rec ) for rec in data?.records)
    
  
  $('#team-records-dlg').on 'show', onteamrecordwindowshow
    
  
  $('#upload-picture-dlg').modal
    backdrop: true
    keyboard: true
    show: false
  
  changePictureClick = ->
    profileid = $(@).attr('data-profileid')
    $('#upload-picture-dlg').modal 'show'
    
  $('#player-picture-change a').on 'click', changePictureClick  
   
  global = makethis.call()
  global.setActiveMenu 5
  
  $('.post-text').on 'focus', ->
    $(@).addClass 'active'
    
  $('.post-text').on 'blur', ->
    val = $(@).val()
    if not val
      $(@).removeClass 'active'
      
  onpostcloseclick = ->
    postpnl = $(@).closest('.post-panel')
    postid = $(postpnl).attr 'data-postid'
    profileid = $(postpnl).attr 'data-profileid'
    
    if postid and profileid
      $.post("/profile/#{profileid}/removepost", postid: postid )
      .success (data) ->
        $(postpnl).hide 'slow'
    
  $('.post-panel > a.post-close-btn').on 'click', onpostcloseclick
  
  oncommentcloseclick = ->
    commentpnl = $(@).closest('.comment-panel')
    postpnl = $(@).closest('.post-panel')
    commentid = $(commentpnl).attr 'data-commentid'
    profileid = $(commentpnl).attr 'data-profileid'
    postid = $(postpnl).attr 'data-postid'
    
    if commentid and profileid
      $.post("/profile/#{profileid}/removecomment", {postid: postid, profileid: profileid, commentid: commentid} )
      .success (data) ->
        $(commentpnl).hide 'slow'
  
  $('.comment-panel > a.post-close-btn').on 'click', oncommentcloseclick
      
  $('textarea').autoResize( extraSpace: 16)
  
  newcommentclick = ->
    profileid = $(@).attr('data-profileid')
    posterid = $(@).attr('data-posterid')
    postid = $(@).attr('data-postid')
    input = $(@).closest('.new-comment').find('textarea.post-text')[0]
    msg = $(input).val()
    
    if msg # has a comment
      $.post("/profile/#{profileid}/addcomment", {postid, posterid, msg})
      .success (data) =>
        if data?.success
          comment = data.comment
          
          el = $.el('div.row.comment-panel', {'data-commentid':comment.id, 'data-profileid':profileid}, [
            $.el('a.post-close-btn'),
            $.el('div.span1.poster-picture', {}, [
              $.el('img', {src:comment.pictureurl}, []) if comment.pictureurl
            ]),
            $.el('div.span4.comment-item', {}, [
              $.el('a', {href: "/profile/#{comment.posterid}"}, [comment.postername]),
              ' wrote', 
              $.el('p', {}, [comment.msg]),
              $.el('div.postmark', {}, ["on #{comment.createdat}"])
            ])            
          ])
          
          $(@).closest('.new-comment').before(el).show('slow')
          console.log $(el)
          $(el).find('a.post-close-btn').on 'click', oncommentcloseclick
          
          $(input).val('')
    
  
  $('.new-comment button').on 'click', newcommentclick


  newpostclick = ->
    profileid = $(@).attr('data-profileid')
    userid = $(@).attr('data-userid')
    msg = $('#newpost-msg').val()
    
    if msg  # has a post
      $.post( "/profile/#{profileid}/addpost", { posterid: userid, msg: msg } )     
      .success (data) ->
        if data?.success
          post = data.post
          
          el = $.el( 'div.row.post-panel', {'data-postid': post.id, 'data-profileid': profileid}, [
            $.el('a.post-close-btn'),
            $.el('div.span1', [$.el('img', {src: post.pictureurl} if post.pictureurl)]),
            $.el('div.span5', [
              $.el('div.post-item', null, [post.desc]),
              $.el('div.postmark', null,["on #{post.createdat}"]),
              $.el('div.post-comment-list', [
                
                $.el('div.row.new-comment', [
                  $.el('div.span5', [
                    $.el('textarea.post-text', {rows:1, placeholder:'Type your comment...'}),
                    $.el('button.btn.btn-mini.btn-primary.pull-right', {'data-postid': post.id, 'data-profileid':profileid, 'data-posterid':userid}, [
                      $.el('i.icon-comment.icon-white'),
                      '&nbsp;Post'
                    ])
                  ])
                ])
              ])
            ])
          ])
            
          el = $(el).prependTo('.post-list').show('slow')
          
          el.find('textarea').autoResize extraSpace: 16
                           
          el.find('.post-text').on 'focus', ->
            $(@).addClass 'active'
            
          el.find('.post-text').on 'blur', ->
            val = $(@).val()
            if not val
              $(@).removeClass 'active'
          
          el.find('.new-comment button').on 'click', newcommentclick
          el.find('.post-panel > a.post-close-btn').on 'click', onpostcloseclick
          
          $('#newpost-msg').val('')
  
  $('.new-post button').on 'click', newpostclick
    
    
