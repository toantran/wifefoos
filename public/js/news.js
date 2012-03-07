(function() {

  jQuery(function($) {
    var global, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    return global.setActiveMenu(4);
  });

}).call(this);
