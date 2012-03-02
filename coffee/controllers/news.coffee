newsSvc = require '../services/news'

exports.index = (req, res, next) ->
  newsSvc.getNews (err, news) ->
    res.send 
      success: not err?
      news: news,
      error: err
    
    
