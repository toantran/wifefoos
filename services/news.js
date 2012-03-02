(function() {
  var newsrepo;

  newsrepo = require('../repository/news');

  exports.getNews = function(callback) {
    if (callback == null) callback = function() {};
    return newsrepo.read({}, function(err, cursor) {
      if ((err != null) || !(cursor != null)) return callback(err);
      return cursor.toArray(callback);
    });
  };

}).call(this);
