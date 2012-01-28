
exports.index = function (req, res, next) {
  getAllPlayers( function(err, players) {
    
    console.log(err, players);
    
    if (err) {
      req.flash('error', err);
    }
    
    res.render(players, {
      layout: true
      , title: 'Wheels Foosball League (WFL) - Players'
    });
  });
}
exports.index.methods = ['GET'];
exports.index.authenticated = true;


function getAllPlayers( callback ) {
  var repo = require('../repository/users');
  
  repo.getAllUsers( callback );
}
