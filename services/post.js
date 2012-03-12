(function() {
  var bootTemplate, bootTemplates, fs, jade, loadComment, matchsvc, teamsvc, templates, usersvc, utils;

  teamsvc = require('./team');

  usersvc = require('./user');

  matchsvc = require('./match');

  utils = require('./utils');

  jade = require('jade');

  fs = require('fs');

  templates = {};

  bootTemplate = function(file) {
    var fn, name, path, str;
    path = "" + __dirname + "/../views/post/" + file;
    name = file.replace('.jade', '');
    str = fs.readFileSync(path, 'utf8');
    fn = jade.compile(str, {
      filename: path,
      pretty: true
    });
    return templates[name] = fn;
  };

  bootTemplates = function() {
    return fs.readdir("" + __dirname + "/../views/post/", function(err, files) {
      var file, _i, _len, _results;
      if (err) throw err;
      _results = [];
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        if (file.indexOf('.jade') >= 0) _results.push(bootTemplate(file));
      }
      return _results;
    });
  };

  bootTemplates();

  exports.init = function() {};

  exports.loadComment = loadComment = function(comment, callback) {
    if (callback == null) callback = function() {};
    return usersvc.getById(comment != null ? comment.posterid : void 0, function(err, user) {
      if (comment != null) {
        comment.pictureurl = user != null ? user.pictureurl : void 0;
      }
      if (comment != null) {
        comment.postername = user != null ? user.nickname : void 0;
      }
      return callback(null, comment);
    });
  };

  exports.makePostGen = function(user) {
    return function(post, callback) {
      var data, genDesc, returnback, setDesc, setPictureUrl, _ref, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      if (callback == null) callback = function() {};
      if (post == null) return callback(null, post);
      setPictureUrl = function(pictureurl) {
        return post.pictureurl = pictureurl;
      };
      setDesc = function(desc) {
        return post.desc = desc;
      };
      returnback = function(err) {
        var _ref;
        if (err) {
          return callback(err, post);
        } else {
          if (post != null ? (_ref = post.comments) != null ? _ref.length : void 0 : void 0) {
            return utils.mapAsync(post != null ? post.comments : void 0, loadComment, function(commentErr, comments) {
              if (post != null) post.comments = comments;
              return callback(commentErr, post);
            });
          } else {
            return callback(null, post);
          }
        }
      };
      data = {
        playerid: user != null ? user._id : void 0,
        playername: user != null ? user.nickname : void 0
      };
      genDesc = function() {
        if (templates[post != null ? post.type : void 0] != null) {
          return setDesc(templates[post != null ? post.type : void 0](data));
        }
      };
      switch (post.type) {
        case 'jointeam':
          setPictureUrl(user.pictureurl);
          return teamsvc.getById(post != null ? (_ref = post.data) != null ? _ref.teamid : void 0 : void 0, function(err, team) {
            data.teamid = team != null ? team._id : void 0;
            data.teamname = team != null ? team.teamname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'invite':
          return utils.execute(usersvc.getById, post != null ? (_ref2 = post.data) != null ? _ref2.playerid : void 0 : void 0).then(function(err, otherplayer, cb) {
            var _ref2;
            if (cb == null) cb = function() {};
            if (err) return returnback(err);
            setPictureUrl(otherplayer != null ? otherplayer.pictureurl : void 0);
            data.otherplayerid = otherplayer != null ? otherplayer._id : void 0;
            data.otherplayername = otherplayer != null ? otherplayer.nickname : void 0;
            return teamsvc.getById(post != null ? (_ref2 = post.data) != null ? _ref2.teamid : void 0 : void 0, cb);
          }).then(function(err, team, cb) {
            if (cb == null) cb = function() {};
            if (err) return returnback(err);
            data.teamid = team != null ? team._id : void 0;
            data.teamname = team != null ? team.teamname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'teamjoin':
          return teamsvc.getById(post != null ? (_ref3 = post.data) != null ? _ref3.teamid : void 0 : void 0, function(err, team) {
            if (err) return returnback(err);
            setPictureUrl(team != null ? team.pictureurl : void 0);
            data.teamid = team != null ? team._id : void 0;
            data.teamname = team != null ? team.teamname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'recruit':
          setPictureUrl(user != null ? user.pictureurl : void 0);
          return usersvc.getById(post != null ? (_ref4 = post.data) != null ? _ref4.playerid : void 0 : void 0, function(err, otherplayer) {
            if (err) return returnback(err);
            data.otherplayerid = otherplayer != null ? otherplayer._id : void 0;
            data.otherplayername = otherplayer != null ? otherplayer.nickname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'newteam':
          setPictureUrl(user != null ? user.pictureurl : void 0);
          return teamsvc.getById(post != null ? (_ref5 = post.data) != null ? _ref5.teamid : void 0 : void 0, function(err, team) {
            if (err) return returnback(err);
            data.teamid = team != null ? team._id : void 0;
            data.teamname = team != null ? team.teamname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'teamchallenging':
        case 'challengedeclined':
        case 'challengedeclining':
        case 'challengecancelled':
        case 'challengeremoved':
          setPictureUrl(user != null ? user.pictureurl : void 0);
          data.matchtype = post != null ? (_ref6 = post.data) != null ? _ref6.matchtype : void 0 : void 0;
          data.matchmsg = post != null ? (_ref7 = post.data) != null ? _ref7.msg : void 0 : void 0;
          return teamsvc.getById(post != null ? (_ref8 = post.data) != null ? _ref8.teamid : void 0 : void 0, function(err, team) {
            if (err) return returnback(err);
            data.teamid = team != null ? team._id : void 0;
            data.teamname = team != null ? team.teamname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'teamchallenged':
          data.matchtype = post != null ? (_ref9 = post.data) != null ? _ref9.matchtype : void 0 : void 0;
          data.matchmsg = post != null ? (_ref10 = post.data) != null ? _ref10.msg : void 0 : void 0;
          return teamsvc.getById(post != null ? (_ref11 = post.data) != null ? _ref11.teamid : void 0 : void 0, function(err, team) {
            if (err) return returnback(err);
            setPictureUrl(team != null ? team.pictureurl : void 0);
            data.teamid = team != null ? team._id : void 0;
            data.teamname = team != null ? team.teamname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'newmatch':
          setPictureUrl('/images/match.jpg');
          return matchsvc.getById(post.data.matchid, function(err, am) {
            var _ref12, _ref13, _ref14, _ref15;
            if (err) return returnback(err);
            data.teamid = am != null ? (_ref12 = am.teams[0]) != null ? _ref12._id : void 0 : void 0;
            data.teamname = am != null ? (_ref13 = am.teams[0]) != null ? _ref13.teamname : void 0 : void 0;
            data.otherteamid = am != null ? (_ref14 = am.teams[1]) != null ? _ref14._id : void 0 : void 0;
            data.otherteamname = am != null ? (_ref15 = am.teams[1]) != null ? _ref15.teamname : void 0 : void 0;
            data.expirationdt = am != null ? am.end : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'post':
          data.postbody = post != null ? (_ref12 = post.data) != null ? _ref12.msg : void 0 : void 0;
          return usersvc.getById(post != null ? (_ref13 = post.data) != null ? _ref13.posterid : void 0 : void 0, function(err, poster) {
            if (err) return returnback(err);
            setPictureUrl(poster != null ? poster.pictureurl : void 0);
            data.playerid = poster != null ? poster._id : void 0;
            data.playername = poster != null ? poster.nickname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        case 'matchresult':
          setPictureUrl(user != null ? user.pictureurl : void 0);
          data.result = post != null ? (_ref14 = post.data) != null ? _ref14.result : void 0 : void 0;
          return teamsvc.getById(post != null ? (_ref15 = post.data) != null ? _ref15.opponentid : void 0 : void 0, function(err, team) {
            if (err) return returnback(err);
            setPictureUrl(team != null ? team.pictureurl : void 0);
            data.teamid = team != null ? team._id : void 0;
            data.teamname = team != null ? team.teamname : void 0;
            try {
              genDesc();
              return returnback(null);
            } catch (e) {
              console.trace(e);
              return returnback(e);
            }
          });
        default:
          setPictureUrl(user != null ? user.pictureurl : void 0);
          setDesc('N/A');
          return returnback(null);
      }
    };
  };

}).call(this);
