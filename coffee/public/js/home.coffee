jQuery ($) ->
  ###
  rendernews = (news) ->
    if news? and Array.isArray(news)    
      _(news)
      .map (val) ->
        '<li><span>' + val?.newscontent + '</span></li>'
      .reduce (prev, val) ->
          prev + val
        , ''            

  $.get('/news')
  .success (data) ->
    if (data? && data.success) 
      html = rendernews data.news
      $(html).prependTo('ul.#league-news')
             .show('slow')

      $('ul#league-news').liScroll();
  ###
                               
