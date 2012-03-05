(function() {

  jQuery(function($) {
    var global, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    return global.setActiveMenu(1);
  });

}).call(this);
