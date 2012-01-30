  // URL /
exports.index = function(req, res) {
  
  if (req.session.user) {
    res.redirect('/profile');
  } else {
    res.render(null, {
      title: 'Wheels Foosball League (WFL)',
    	user: req.session.user,
    	layout: true
    });
  }
};
exports.index.methods = ['GET'];


/*
  GET, POST
  URL /logout
*/
exports.logout = function(req, res) {
  res.redirect('/account/logout');
}
exports.logout.methods = ['POST', 'GET'];


/*
  GET
  URL /login
*/
exports.login = function(req, res) {
  res.redirect('/account/login');
}
exports.login.methods = ['POST', 'GET'];

/*
  GET
  URL /rules
*/

exports.rules = function (req, res) {
  res.render(null, {
    layout: true,
    title: 'WHeels Foosball League - Rules'
  });
}
