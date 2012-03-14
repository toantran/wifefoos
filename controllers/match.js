(function() {
  var __slice = Array.prototype.slice;

  exports.update = function(req, res, next) {
    var callback, matchid, matchsvc, playerid, result, teamid, utils,
      _this = this;
    matchid = req.params.id;
    teamid = req.param('teamid', '');
    playerid = req.param('playerid', '');
    result = req.param('result', '');
    callback = function(err) {
      return res.send({
        success: false,
        error: err
      });
    };
    if (!matchid || !teamid || !playerid || !result) {
      return res.send({
        success: false,
        error: 'Ids empty'
      });
    } else if (result !== 'win' && result !== 'lose') {
      return res.send({
        success: false,
        error: 'Invalid result'
      });
    } else {
      matchsvc = require('../services/match');
      utils = require('../services/utils');
      return utils.execute(matchsvc.addVote, matchid, playerid, teamid, result).then(function() {
        var args, cb, err, _i;
        err = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        return matchsvc.getById(matchid, cb);
      }).then(function(err, am, cb) {
        var _ref, _ref2, _ref3, _ref4, _ref5;
        _this.am = am;
        if (cb == null) cb = function() {};
        if (err) return callback(err);
        if (!(_this.am != null)) return callback('match not found');
        _this.totalplayers = (_ref = _this.am) != null ? (_ref2 = _ref.teams) != null ? _ref2.map(function(team) {
          var _ref3, _ref4;
          return (_ref3 = team != null ? (_ref4 = team.members) != null ? _ref4.length : void 0 : void 0) != null ? _ref3 : 0;
        }).reduce(function(prev, curr) {
          return prev + curr;
        }, 0) : void 0 : void 0;
        _this.totalvotes = (_ref3 = (_ref4 = _this.am) != null ? (_ref5 = _ref4.votes) != null ? _ref5.length : void 0 : void 0) != null ? _ref3 : 0;
        _this.totalDecisions = matchsvc.countDecisions(_this.am);
        if (_this.totalvotes >= _this.totalplayers || _this.totalDecisions > _this.totalplayers / 2) {
          matchsvc.finalize(_this.am, cb);
        }
        return res.send({
          success: true
        });
      }).then(function(err) {
        return console.log(err);
      });
    }
  };

}).call(this);
