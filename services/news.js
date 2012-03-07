(function() {
  var newsrepo;

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

}).call(this);
