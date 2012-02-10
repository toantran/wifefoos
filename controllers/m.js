(function() {
  var login;

  login = function(req, res, next) {
    res.render({
      layout: false
    });
    return true;
  };

  exports.login = login;

}).call(this);
