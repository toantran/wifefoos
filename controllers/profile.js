
/*
  GET
  URL /profile
  Redirect to /profile/show with current user id
*/
exports.index = function(req, res) {
  var user = req.session.user
    , userId = user._id || '';
  
  // redirect to show with current user id
  res.redirect('/profile/' + userId);  
}
exports.index.methods = ['GET'];
exports.index.authenticated = true;


/*
  GET
  URL /profile/show
*/
exports.show = function(req, res, next) {
  var userId = req.params.id || null;
  
  if (!userId) {
    req.flash('error', 'player id is empty');
    next();
    //res.render(null, {
    //  layout: true
    //  , title: 'W.I.F.E - Profile'
    //});
    return;
  }
  
  getUser(userId, function(error, user) {
    if (error) {
      req.flash('error', error);
      next();
    } else {
      res.render( user, {
        layout: true
        , title: 'W.I.F.E - Profile'
        , user: req.session.user
      });
    }
  });
}
exports.show.methods = ['GET'];
exports.show.authenticated = true; 


/*
  get a full tree user object
*/
function getUser(userId, callback) {
  var repo = require('../repository/users');
  
  repo.getFullUser(userId, function(error, user) {
    if (error) {
      console.log(error);
      callback(error);
    } else {
      loadTeamForUser(user, function(user) {
        callback(null, user);
      });
      //callback(null, user);
    }
  });
  
  return true;
};


/*
  Load team object for user
*/
function loadTeamForUser(user, callback) {
  if (user && user.team && user.team._id) {
    var repo = require('../repository/teams');
    
    repo.getFullTeam(String(user.team._id), function(error, team) {
      if (team) {
        console.log(team);
        user.team = team;
      }
      callback(user);
    });
  } else {
    callback(user);
  }
};

