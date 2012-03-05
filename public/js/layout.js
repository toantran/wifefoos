(function() {

  jQuery(function($) {
    var global, makethis;
    makethis = function() {
      return this;
    };
    global = makethis.call();
    return global.setActiveMenu = function(menuIndex) {
      $('ul.nav > li').removeClass('active');
      return $($('ul.nav > li')[menuIndex]).addClass('active');
    };
  });

}).call(this);
