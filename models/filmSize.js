const mongoose = require('mongoose');

const filmSizeSchema = new mongoose.Schema({
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
    filmTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FilmType',
      },
    ],
  },
  includedFilmSizes: {
    f35mmMounted: Boolean,
  },
});

module.exports = mongoose.model('FilmSize', filmSizeSchema);
