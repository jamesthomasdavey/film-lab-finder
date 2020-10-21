const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
  },
  filmType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FilmType',
  },
  filmSize: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FilmSize',
  },
  hasDev: {
    type: Boolean,
    default: false,
  },
  hasScan: {
    type: Boolean,
    default: false,
  },
  hasPrint: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Service', serviceSchema);
