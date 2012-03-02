$(function() {
  
  var rendernews = function(news) {
    if (news && news.length) {
      
      return _(news)
        .map(function(val) {
          return '<li><span>' + val.newscontent + '</span></li>';
        })
        .reduce( function(prev, val) {
          return prev + val;
        }, '' );            
    }
  };
  
  $.get('/news')
  .success( function(data) {
    if (data && data.success) {
        var html = rendernews(data.news);
        var el = $(html).prependTo('ul.#league-news')
                         .show('slow');
                         
        $('ul#league-news').liScroll();                           
      }
  });
  
});
