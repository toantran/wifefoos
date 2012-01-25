
  // URL /
exports.index = function(req, res) {
  res.render(null, {
    title: 'ScrumTrak',
  	user: req.session.user,
  	layout: true
  });
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
