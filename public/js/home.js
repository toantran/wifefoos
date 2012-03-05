(function() {

  jQuery(function($) {
    var rendernews;
    rendernews = function(news) {
      if ((news != null) && Array.isArray(news)) {
        return _(news).map(function(val) {
          return '<li><span>' + (val != null ? val.newscontent : void 0) + '</span></li>';
        }).reduce(function(prev, val) {
          return prev + val;
        }, '');
      }
    };
    return $.get('/news').success(function(data) {
      var html;
      if ((data != null) && data.success) {
        html = rendernews(data.news);
        $(html).prependTo('ul.#league-news').show('slow');
        return $('ul#league-news').liScroll();
      }
    });
  });

}).call(this);
