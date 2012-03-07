newsrepo = require '../repository/news'

exports.getNews = (callback = ->) ->
  newsrepo.read {}, (err, cursor) ->
    return callback(err) if err? or not cursor?
    cursor.sort createdat: -1
    cursor.toArray callback    
    
exports.getHighlights = (callback = ->) ->
  newsrepo.read {highlight: 1}, (err, cursor) ->
    return callback(err) if err? or not cursor?
    cursor.sort createdat: -1
    cursor.toArray callback
