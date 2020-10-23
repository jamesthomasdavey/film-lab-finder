const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  filmRolls: [
    {
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    },
  ],
});

module.exports = mongoose.model('Cart', cartSchema);
