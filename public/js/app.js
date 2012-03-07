(function() {

  jQuery(function($) {
    var global, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    return $.publish = function(title, body) {
      return console.log(title, body);
    };
  });

}).call(this);
