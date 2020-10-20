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
});

module.exports = mongoose.model('FilmType', filmTypeSchema);
