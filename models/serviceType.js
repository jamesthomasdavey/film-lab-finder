const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  compatibilities: {
    filmTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FilmType',
      },
    ],
    filmSizes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FilmSize',
      },
    ],
  },
  includedServiceTypes: {
    dev: Boolean,
    scan: Boolean,
  },
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
