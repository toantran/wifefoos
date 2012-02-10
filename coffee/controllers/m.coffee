login = (req, res, next) -> 
  res.render {
    layout: false
  }
  true
  
exports.login = login
