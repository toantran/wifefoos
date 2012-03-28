newsrepo = require '../repository/news'

exports.getNews = (callback = ->) ->
  newsrepo.read {}, (err, cursor) ->
    return callback(err) if err? or not cursor?
    cursor.sort createdat: -1
    cursor.toArray ->           
      callback.apply null, arguments
      cursor.close()
    
exports.getHighlights = (callback = ->) ->
  newsrepo.read {highlight: 1}, (err, cursor) ->
    return callback(err) if err? or not cursor?
    cursor.sort createdat: -1
    cursor.toArray ->           
      callback.apply null, arguments
      cursor.close()

    
    
createNewsContent = (tpl, data) ->
  jade = require 'jade'
  fs = require 'fs'
  path = "#{__dirname}/../views/news/#{tpl}.jade"
  str = fs.readFileSync(path, 'utf8')
  fn = jade.compile str, 
    filename: path
    pretty: true  
  fn data
  
    
exports.createNews = createNews = (news..., callback = ->) ->
  [newsObj, newsTpl, newsData] = news
  
  if typeof newsObj is 'string'
    [newsTpl, newsData] = [newsObj, newsTpl]
    newsObj =
      newstpl : newsTpl
      newsdata : newsData
  
  newsObj.newstpl ?= newsTpl
  newsObj.newsdata ?= newsData
  newsObj.newsstatus ?= 'active'
  newsObj.newsdate ?= new Date()
  
  if newsObj?.newstpl? and newsObj?.newsdata?
    newsObj.newscontent = createNewsContent newsObj?.newstpl, newsObj?.newsdata
  
  newsrepo.create newsObj, (err, insertedObjs) ->
    insertedNews = insertedObjs?[0]
    callback err, insertedNews
    
    
exports.createMatchResultNews = (matchdata, callback = ->) ->
  news = 
    highlight: 1
    newsdate: new Date()
    newsstatus: 'active'
    newsdata: matchdata
    caption: 'Match Result'
    pictureurl: '/images/matchresult.jpg'
  createNews news, 'matchresult', matchdata, callback
    
  
    
