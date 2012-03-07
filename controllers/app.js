
/*
URL /
*/

(function() {

  exports.index = function(req, res) {
    var newsSvc, utils,
      _this = this;
    newsSvc = require('../services/news');
    utils = require('../services/utils');
    return utils.execute(newsSvc.getNews).then(function(err, news, cb) {
      _this.news = news;
      if (cb == null) cb = function() {};
      return newsSvc.getHighlights(cb);
    }).then(function(err, highlights, cb) {
      _this.highlights = highlights;
      if (cb == null) cb = function() {};
      res.render(null, {
        title: 'Wheels Foosball League (WFL)'
      });
      return {
        user: req.session.user,
        layout: true,
        news: _this.news,
        highlights: _this.highlights
      };
    });
  };

  exports.index.methods = ['GET'];

  /*
    GET, POST
    URL /logout
  */

  exports.logout = function(req, res) {
    return res.redirect('/account/logout');
  };

  exports.logout.methods = ['POST', 'GET'];

  /*
    GET
    URL /login
  */

  exports.login = function(req, res) {
    return res.redirect('/account/login');
  };

  exports.login.methods = ['POST', 'GET'];

  /*
    GET
    URL /rules
  */

  exports.rules = function(req, res) {
    return res.render(null, {
      layout: true,
      title: 'Wheels Foosball League - Rules'
    });
  };

}).call(this);
