jQuery ($) ->
  makethis = -> @
    
  global = makethis.call()
  global.setActiveMenu 5
  
  $('.new-post button').on 'click', ->
    profileid = $(@).attr('data-profileid')
    userid = $(@).attr('data-userid')
    msg = $('#newpost-msg').val()
    
    if msg  # has a post
      $.post( "/profile/#{profileid}/addpost", { posterid: userid, msg: msg } )     
      .success (data) ->
        if data?.success
          post = data.post
          
          el = $.el( 'div.row.post-panel', {postid: post.id, profileid: profileid}, [
            $.el('a.post-close-btn'),
            $.el('div.span1', [$.el('img', {src: post.pictureurl} if post.pictureurl)]),
            $.el('div.span5', [
              $.el('div.post-item', , post.desc),
              $.el('div.postmark', ,"on #{post.createdat}"),
              $.el('div.post-comment-list', [
                
                $.el('div.row.new-comment', [
                  $.el('div.span5', [
                    $.el('textarea.post-text', {rows:1, placeholder:'Type your comment...'}),
                    $.el('button.btn.btn-mini.btn-primary.pull-right', {postid: post.id, profileid:profileid, posterid:userid}, [
                      $.el('i.icon-comment.icon-white'),
                      '&nbsp;Post'
                    ])
                  ])
                ])
              ])
            ])
          ])
            
          el = $(el).prependTo('.post-list').show('slow')
                           
#          el.find('.post-new-comment textarea')
#            .watermark('Write something...')
#            .elastic();
#          el.find('.post-new-comment button').button();
#          el.find('.post-new-comment button').click(profile.newcommentclick);
          $('#newpost-msg').val('')
    
