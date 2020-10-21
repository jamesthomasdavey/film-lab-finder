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
  servicesOffered: {
    type: Array,
    default: [],
  },
});

module.exports = mongoose.model('Lab', labSchema);
