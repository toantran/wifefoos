(function() {
  var userSvc;

  userSvc = require('../services/user');

  /*
    POST
    URL /profile/:id/removecomment
  */

  exports.removecomment = function(req, res, next) {
    var commentid, postid, userid;
    userid = req.params.id;
    postid = req.param('postid', '');
    commentid = req.param('commentid', '');
    if (!userid) return res.send();
    try {
      return userSvc.removeComment(userid, postid, commentid, function(error, comment) {
        var result;
        result = {
          success: true
        };
        if (error) {
          result.success = false;
          result.error = error;
        } else {
          result.comment = comment;
        }
        return res.send(result);
      });
    } catch (e) {
      console.trace(e);
      req.flash('error', e);
      return next(e);
    }
  };

  exports.removecomment.authenticated = true;

  exports.removecomment.methods = ['POST'];

  exports.removecomment.action = ':id/removecomment';

  /*
    POST
    URL /profile/:id/addcomment
  */

  exports.addcomment = function(req, res, next) {
    var comment, msg, posterid, postid, userid;
    userid = req.params.id;
    postid = req.param('postid', '');
    posterid = req.param('posterid', '');
    msg = req.param('msg', '');
    comment = {
      posterid: posterid,
      msg: msg
    };
    try {
      return userSvc.addComment(userid, postid, comment, function(error, addedcomment) {
        var postSvc, result;
        result = {
          success: true
        };
        if (error) {
          result.success = false;
          result.error = error;
          return res.send(result);
        } else {
          postSvc = require('../services/post');
          try {
            return postSvc.loadComment(comment, function(error, fullComment) {
              if (error) {
                result.comment = comment;
              } else {
                result.comment = fullComment;
              }
              return res.send(result);
            });
          } catch (e) {
            console.trace(e);
            req.flash('error', e);
            return next();
          }
        }
      });
    } catch (e) {
      console.trace(e);
      req.flash('error', e);
      return next(e);
    }
  };

  exports.addcomment.authenticated = true;

  exports.addcomment.methods = ['POST'];

  exports.addcomment.action = ':id/addcomment';

  /*
    POST
    URL /profile/:id/removepost
  */

  exports.removePost = function(req, res, next) {
    var postid, userid;
    userid = req.params.id;
    postid = req.param('postid', '');
    if (!userid) return res.send();
    try {
      return userSvc.removePost(userid, postid, function(error, post) {
        var result;
        result = {
          success: true
        };
        if (error) {
          result.success = false;
          result.error = error;
        } else {
          result.post = post;
        }
        return res.send(result);
      });
    } catch (e) {
      console.trace(e);
      req.flash('error', e);
      return next(e);
    }
  };

  exports.removePost.authenticated = true;

  exports.removePost.methods = ['POST'];

  exports.removePost.action = ':id/removepost';

  /*
    POST
    URL /profile/:id/addpost
  */

  exports.addPost = function(req, res, next) {
    var msg, post, posterid, userid;
    userid = req.params.id;
    posterid = req.param('posterid', '');
    msg = req.param('msg', '');
    post = {
      type: 'post',
      data: {
        posterid: posterid,
        msg: msg
      },
      createdat: new Date()
    };
    if (!userid) return res.send();
    try {
      return userSvc.addPost(userid, post, function(error, fullPost) {
        var postSvc, result;
        result = {
          success: true
        };
        if (error) {
          result.success = false;
          return result.error = error;
        } else {
          postSvc = require('../services/post');
          postSvc.init();
          return postSvc.makePostGen(req.user)(post, function(err, fullpost) {
            if (fullpost != null) {
              result.post = fullpost;
            } else {
              result.post = post;
            }
            return res.send(result);
          });
        }
      });
    } catch (e) {
      console.trace(e);
      req.flash('error', e);
      return next(e);
    }
  };

  exports.addPost.authenticated = true;

  exports.addPost.action = ':id/addpost';

  exports.addPost.methods = ['POST'];

  /*
    GET
    URL /profile
    Redirect to /profile/show with current user id
  */

  exports.index = function(req, res, next) {
    var userId, _ref, _ref2;
    userId = (_ref = req != null ? (_ref2 = req.user) != null ? _ref2._id : void 0 : void 0) != null ? _ref : '';
    return res.redirect('/profile/' + userId);
  };

  exports.index.methods = ['GET'];

  exports.index.authenticated = true;

  /*
    GET
    URL /profile/show
  */

  exports.show = function(req, res, next) {
    var playerid, _ref;
    playerid = (_ref = req.params) != null ? _ref.id : void 0;
    if (!(playerid && playerid !== 'undefined')) return next();
    try {
      return userSvc.getFullUser(playerid, function(err, fullplayer) {
        if (err) {
          req.flash('error', err);
          return next(err);
        } else {
          return res.render(fullplayer, {
            layout: true,
            title: 'WFL - Profile'
          });
        }
      });
    } catch (e) {
      console.trace(e);
      req.flash('error', e);
      return next(e);
    }
  };

  exports.show.methods = ['GET'];

  exports.show.authenticated = true;

}).call(this);
