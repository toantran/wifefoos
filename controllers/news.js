(function() {
  var newsSvc;

  newsSvc = require('../services/news');

  exports.index = function(req, res, next) {
    return newsSvc.getNews(function(err, news) {
      return res.send({
        success: !(err != null),
        news: news,
        error: err
      });
    });
  };

}).call(this);
