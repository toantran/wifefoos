(function() {
  var baseDb, baseRepo;

  baseDb = require('./base');

  baseRepo = new baseDb.repository('matches');

  exports.create = baseRepo.create;

  exports.read = baseRepo.read;

  exports.update = baseRepo.update;

  exports.remove = baseRepo.remove;

  exports.getById = baseRepo.getById;

  exports.ObjectId = baseRepo.ObjectId;

}).call(this);
