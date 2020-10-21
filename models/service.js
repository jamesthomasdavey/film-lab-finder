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
  includedServiceTypes: {
    dev: {
      type: Boolean,
      default: false,
    },
    scan: {
      type: Boolean,
      default: false,
    },
    print: {
      type: Boolean,
      default: false,
    },
  },
});

module.exports = mongoose.model('Service', serviceSchema);
