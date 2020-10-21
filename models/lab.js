const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  ownedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  servicesOffered: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
  ],
});

module.exports = mongoose.model('Lab', labSchema);
