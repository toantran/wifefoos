(function() {

  jQuery(function($) {
    var global, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    return global.setActiveMenu(3);
  });

}).call(this);
