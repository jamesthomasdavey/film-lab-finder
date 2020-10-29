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
  services: [
    {
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
      doesOffer: {
        type: Boolean,
        default: false,
      },
      basePrice: {
        type: Number,
        required: doesOffer,
      },
    },
  ],
  settings: {
    rawByOrder: {
      isEnabled: {
        type: Boolean,
        default: false,
      },
      price: {
        type: Number,
        required: isEnabled,
      },
    },
    scanners: {
      scannerA: String,
      scannerB: String,
      scannerC: String,
    },
    scanResolutions: {
      f35mm: {
        sizeA: Number,
        sizeB: Number,
        sizeC: Number,
      },
      f35mmPano: {
        sizeA: Number,
        sizeB: Number,
        sizeC: Number,
      },
      f120: {
        sizeA: Number,
        sizeB: Number,
        sizeC: Number,
      },
      f4x5: {
        sizeA: Number,
        sizeB: Number,
        sizeC: Number,
      },
      f8x10: {
        sizeA: Number,
        sizeB: Number,
        sizeC: Number,
      },
    },
    customScanOptions: {
      
    }
  },
});

module.exports = mongoose.model('Lab', labSchema);
