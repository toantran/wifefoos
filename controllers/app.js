
/*
URL /
*/

(function() {

  exports.index = function(req, res) {
    res.render(null, {
      title: 'Wheels Foosball League (WFL)'
    });
    return {
      user: req.session.user,
      layout: true
    };
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
