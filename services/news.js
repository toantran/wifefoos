(function() {
  var createNews, createNewsContent, newsrepo,
    __slice = Array.prototype.slice;

  newsrepo = require('../repository/news');

  exports.getNews = function(callback) {
    if (callback == null) callback = function() {};
    return newsrepo.read({}, function(err, cursor) {
      if ((err != null) || !(cursor != null)) return callback(err);
      cursor.sort({
        createdat: -1
      });
      return cursor.toArray(callback);
    });
  };

  exports.getHighlights = function(callback) {
    if (callback == null) callback = function() {};
    return newsrepo.read({
      highlight: 1
    }, function(err, cursor) {
      if ((err != null) || !(cursor != null)) return callback(err);
      cursor.sort({
        createdat: -1
      });
      return cursor.toArray(callback);
    });
  };

  createNewsContent = function(tpl, data) {
    var fn, fs, jade, path, str;
    jade = require('jade');
    fs = require('fs');
    path = "" + __dirname + "/../views/news/" + tpl + ".jade";
    str = fs.readFileSync(path, 'utf8');
    fn = jade.compile(str, {
      filename: path,
      pretty: true
    });
    return fn(data);
  };

  exports.createNews = createNews = function() {
    var callback, news, newsData, newsObj, newsTpl, _i, _ref;
    news = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), callback = arguments[_i++];
    if (callback == null) callback = function() {};
    newsObj = news[0], newsTpl = news[1], newsData = news[2];
    if (typeof newsObj === 'string') {
      _ref = [newsObj, newsTpl], newsTpl = _ref[0], newsData = _ref[1];
      newsObj = {
        newstpl: newsTpl,
        newsdata: newsData
      };
    }
    if (newsObj.newstpl == null) newsObj.newstpl = newsTpl;
    if (newsObj.newsdata == null) newsObj.newsdata = newsData;
    if (newsObj.newsstatus == null) newsObj.newsstatus = 'active';
    if (newsObj.newsdate == null) newsObj.newsdate = new Date();
    if (((newsObj != null ? newsObj.newstpl : void 0) != null) && ((newsObj != null ? newsObj.newsdata : void 0) != null)) {
      newsObj.newscontent = createNewsContent(newsObj != null ? newsObj.newstpl : void 0, newsObj != null ? newsObj.newsdata : void 0);
    }
    return newsrepo.create(newsObj, function(err, insertedObjs) {
      var insertedNews;
      insertedNews = insertedObjs != null ? insertedObjs[0] : void 0;
      return callback(err, insertedNews);
    });
  };

  exports.createMatchResultNews = function(matchdata, callback) {
    var news;
    if (callback == null) callback = function() {};
    news = {
      highlight: 1,
      newsdate: new Date(),
      newsstatus: 'active',
      newsdata: matchdata,
      caption: 'Match Result',
      pictureurl: '/images/matchresult.jpg'
    };
    return createNews(news, 'matchresult', matchdata, callback);
  };

}).call(this);
