(function() {
  var newsSvc;

  newsSvc = require('../services/news');

  exports.index = function(req, res, next) {
    return newsSvc.getNews(function(err, news) {
      return res.render(news, {
        title: 'WFL - News',
        layout: true
      });
    });
  };

  exports.add = function(req, res, next) {
    return res.render(null, {
      title: 'WFL - News',
      layout: true
    });
  };

}).call(this);
