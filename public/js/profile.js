(function() {

  jQuery(function($) {
    var changePictureClick, global, makerow, makethis, newcommentclick, newpostclick, oncommentcloseclick, onplayerrecordwindowshow, onpostcloseclick, onteamrecordwindowshow;
    makethis = function() {
      return this;
    };
    makerow = function(rec) {
      var dt;
      if (!(rec != null)) return null;
      dt = new Date(rec.createdat);
      return $.el('div.row', {}, [
        $.el('div.span3', {}, [dt.toLocaleDateString()]), $.el('div.span2', {}, [
          'vs ', $.el('a', {
            href: rec.teamid
          }, [rec.teamname])
        ]), $.el('div.span1', {}, [rec.result])
      ]);
    };
    onplayerrecordwindowshow = function() {
      var container, playerid;
      container = $(this).find('.records-container');
      playerid = $(this).attr('data-playerid');
      return $.get("/profile/" + playerid + "/records").success(function(data) {
        var rec, rows, _ref;
        if (data != null ? data.success : void 0) {
          $(container).empty();
          if (data != null) {
            if ((_ref = data.records) != null) {
              _ref.sort(function(rec1, rec2) {
                var dt1, dt2;
                dt1 = new Date(rec1 != null ? rec1.createdat : void 0);
                dt2 = new Date(rec2 != null ? rec2.createdat : void 0);
                return dt2 - dt1;
              });
            }
          }
          return rows = (function() {
            var _i, _len, _ref2, _results;
            _ref2 = data != null ? data.records : void 0;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              rec = _ref2[_i];
              _results.push($(container).append(makerow(rec)));
            }
            return _results;
          })();
        }
      });
    };
    $('#player-records-dlg').on('show', onplayerrecordwindowshow);
    onteamrecordwindowshow = function() {
      var container, teamid;
      container = $(this).find('.records-container');
      teamid = $(this).attr('data-teamid');
      return $.get("/team/" + teamid + "/records").success(function(data) {
        var rec, rows, _ref;
        if (data != null ? data.success : void 0) {
          $(container).empty();
          if (data != null) {
            if ((_ref = data.records) != null) {
              _ref.sort(function(rec1, rec2) {
                var dt1, dt2;
                dt1 = new Date(rec1 != null ? rec1.createdat : void 0);
                dt2 = new Date(rec2 != null ? rec2.createdat : void 0);
                return dt2 - dt1;
              });
            }
          }
          return rows = (function() {
            var _i, _len, _ref2, _results;
            _ref2 = data != null ? data.records : void 0;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              rec = _ref2[_i];
              _results.push($(container).append(makerow(rec)));
            }
            return _results;
          })();
        }
      });
    };
    $('#team-records-dlg').on('show', onteamrecordwindowshow);
    $('#upload-picture-dlg').modal({
      backdrop: true,
      keyboard: true,
      show: false
    });
    changePictureClick = function() {
      var profileid;
      profileid = $(this).attr('data-profileid');
      return $('#upload-picture-dlg').modal('show');
    };
    $('#player-picture-change a').on('click', changePictureClick);
    global = makethis.call();
    global.setActiveMenu(5);
    $('.post-text').on('focus', function() {
      return $(this).addClass('active');
    });
    $('.post-text').on('blur', function() {
      var val;
      val = $(this).val();
      if (!val) return $(this).removeClass('active');
    });
    onpostcloseclick = function() {
      var postid, postpnl, profileid;
      postpnl = $(this).closest('.post-panel');
      postid = $(postpnl).attr('data-postid');
      profileid = $(postpnl).attr('data-profileid');
      if (postid && profileid) {
        return $.post("/profile/" + profileid + "/removepost", {
          postid: postid
        }).success(function(data) {
          return $(postpnl).hide('slow');
        });
      }
    };
    $('.post-panel > a.post-close-btn').on('click', onpostcloseclick);
    oncommentcloseclick = function() {
      var commentid, commentpnl, postid, postpnl, profileid;
      commentpnl = $(this).closest('.comment-panel');
      postpnl = $(this).closest('.post-panel');
      commentid = $(commentpnl).attr('data-commentid');
      profileid = $(commentpnl).attr('data-profileid');
      postid = $(postpnl).attr('data-postid');
      if (commentid && profileid) {
        return $.post("/profile/" + profileid + "/removecomment", {
          postid: postid,
          profileid: profileid,
          commentid: commentid
        }).success(function(data) {
          return $(commentpnl).hide('slow');
        });
      }
    };
    $('.comment-panel > a.post-close-btn').on('click', oncommentcloseclick);
    $('textarea').autoResize({
      extraSpace: 16
    });
    newcommentclick = function() {
      var input, msg, posterid, postid, profileid,
        _this = this;
      profileid = $(this).attr('data-profileid');
      posterid = $(this).attr('data-posterid');
      postid = $(this).attr('data-postid');
      input = $(this).closest('.new-comment').find('textarea.post-text')[0];
      msg = $(input).val();
      if (msg) {
        return $.post("/profile/" + profileid + "/addcomment", {
          postid: postid,
          posterid: posterid,
          msg: msg
        }).success(function(data) {
          var comment, el;
          if (data != null ? data.success : void 0) {
            comment = data.comment;
            el = $.el('div.row.comment-panel', {
              'data-commentid': comment.id,
              'data-profileid': profileid
            }, [
              $.el('a.post-close-btn'), $.el('div.span1.poster-picture', {}, [
                comment.pictureurl ? $.el('img', {
                  src: comment.pictureurl
                }, []) : void 0
              ]), $.el('div.span4.comment-item', {}, [
                $.el('a', {
                  href: "/profile/" + comment.posterid
                }, [comment.postername]), ' wrote', $.el('p', {}, [comment.msg]), $.el('div.postmark', {}, ["on " + comment.createdat])
              ])
            ]);
            $(_this).closest('.new-comment').before(el).show('slow');
            console.log($(el));
            $(el).find('a.post-close-btn').on('click', oncommentcloseclick);
            return $(input).val('');
          }
        });
      }
    };
    $('.new-comment button').on('click', newcommentclick);
    newpostclick = function() {
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
              'data-postid': post.id,
              'data-profileid': profileid
            }, [
              $.el('a.post-close-btn'), $.el('div.span1', [
                $.el('img', post.pictureurl ? {
                  src: post.pictureurl
                } : void 0)
              ]), $.el('div.span5', [
                $.el('div.post-item', null, [post.desc]), $.el('div.postmark', null, ["on " + post.createdat]), $.el('div.post-comment-list', [
                  $.el('div.row.new-comment', [
                    $.el('div.span5', [
                      $.el('textarea.post-text', {
                        rows: 1,
                        placeholder: 'Type your comment...'
                      }), $.el('button.btn.btn-mini.btn-primary.pull-right', {
                        'data-postid': post.id,
                        'data-profileid': profileid,
                        'data-posterid': userid
                      }, [$.el('i.icon-comment.icon-white'), '&nbsp;Post'])
                    ])
                  ])
                ])
              ])
            ]);
            el = $(el).prependTo('.post-list').show('slow');
            el.find('textarea').autoResize({
              extraSpace: 16
            });
            el.find('.post-text').on('focus', function() {
              return $(this).addClass('active');
            });
            el.find('.post-text').on('blur', function() {
              var val;
              val = $(this).val();
              if (!val) return $(this).removeClass('active');
            });
            el.find('.new-comment button').on('click', newcommentclick);
            el.find('.post-panel > a.post-close-btn').on('click', onpostcloseclick);
            return $('#newpost-msg').val('');
          }
        });
      }
    };
    return $('.new-post button').on('click', newpostclick);
  });

}).call(this);
