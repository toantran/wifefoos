(function() {

  jQuery(function($) {
    var global, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    global.setActiveMenu(5);
    return $('.new-post button').on('click', function() {
      var msg, profileid, userid;
      profileid = $(this).attr('data-profileid');
      userid = $(this).attr('data-userid');
      msg = $('#newpost-msg').val();
      if (msg) {
        return $.post("/profile/" + profileid + "/addpost", {
          posterid: userid,
          msg: msg
        }).success(function(data) {
          var el, post;
          if (data != null ? data.success : void 0) {
            post = data.post;
            el = $.el('div.row.post-panel', {
              postid: post.id,
              profileid: profileid
            }, [
              $.el('a.post-close-btn'), $.el('div.span1', [
                $.el('img', post.pictureurl ? {
                  src: post.pictureurl
                } : void 0)
              ]), $.el('div.span5', [
                $.el('div.post-item', post.desc), $.el('div.postmark', "on " + post.createdat), $.el('div.post-comment-list', [
                  $.el('div.row.new-comment', [
                    $.el('div.span5', [
                      $.el('textarea.post-text', {
                        rows: 1,
                        placeholder: 'Type your comment...'
                      }), $.el('button.btn.btn-mini.btn-primary.pull-right', {
                        postid: post.id,
                        profileid: profileid,
                        posterid: userid
                      }, [$.el('i.icon-comment.icon-white'), $.el('&nbsp;Post')])
                    ])
                  ])
                ])
              ])
            ]);
            el = $(el).prependTo('.post-list').show('slow');
            return $('#newpost-msg').val('');
          }
        });
      }
    });
  });

}).call(this);
