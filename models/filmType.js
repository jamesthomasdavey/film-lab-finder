const mongoose = require('mongoose');

const filmTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  compatibilities: {
    serviceTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServiceType',
      },
    ],
    filmSizes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FilmSize',
      },
    ],
  },
  includedFilmTypes: {
    e6: Boolean,
  },
});

module.exports = mongoose.model('FilmType', filmTypeSchema);
