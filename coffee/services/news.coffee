newsrepo = require '../repository/news'

exports.getNews = (callback = ->) ->
  newsrepo.read {}, (err, cursor) ->
    return callback(err) if err? or not cursor?
    cursor.toArray callback
