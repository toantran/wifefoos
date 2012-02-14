(function() {
  var matchRepo;

  matchRepo = require('../repository/matches');

  exports.getPendingExpiredMatches = function(callback) {
    var query;
    query = {
      status: 'pending',
      end: {
        $lt: new Date()
      }
    };
    try {
      return matchRepo.query(query, callback);
    } catch (e) {
      console.log(e);
      throw e;
    }
  };

}).call(this);
