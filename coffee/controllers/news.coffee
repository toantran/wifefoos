newsSvc = require '../services/news'

exports.index = (req, res, next) ->
  newsSvc.getNews (err, news) ->
    res.render news, 
      title: 'WFL - News'
      layout: true
    

exports.add = (req, res, next) ->
  res.render null,
    title: 'WFL - News'
    layout: true
