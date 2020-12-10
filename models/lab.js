const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  description: { type: String, default: '' },
  ownedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  settings: {
    shipSettings: {
      allowDropoff: { type: Boolean, default: false },
      allowPickup: { type: Boolean, default: false },
      shippingPrice: { type: Number, default: 10 },
    },
    devSettings: {
      isEnabled: { type: Boolean, default: false },
    },
    scanSettings: {
      isEnabled: { type: Boolean, default: false },
      rawByOrder: {
        isEnabled: { type: Boolean, default: false },
        price: { type: Number, default: 10 },
      },
      scanners: {
        defaultScanner: {
          // make sure this is required if scanning is enabled
          name: { type: String, default: 'Noritsu' },
          desc: { type: String, default: '' },
        },
        scannerB: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: 'Fuji Frontier' },
          desc: { type: String, default: '' },
        },
        scannerC: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
      },
      scanResolutions: {
        defaultScanRes: {
          // make sure this is required if scanning is enabled
          name: { type: String, default: 'Medium Scans' },
          sfShortEdge: { type: Number, default: 1002 },
          mfShortEdge: { type: Number, default: 1002 },
          f4x5ShortEdge: { type: Number, default: 1002 },
          f8x10ShortEdge: { type: Number, default: 1002 },
        },
        scanResB: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: 'Large Scans' },
          sfShortEdge: { type: Number, default: 2000 },
          mfShortEdge: { type: Number, default: 2000 },
          f4x5ShortEdge: { type: Number, default: 2000 },
          f8x10ShortEdge: { type: Number, default: 2000 },
        },
        scanResC: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: 'X-Large Scans' },
          sfShortEdge: { type: Number, default: 4000 },
          mfShortEdge: { type: Number, default: 4000 },
          f4x5ShortEdge: { type: Number, default: 4000 },
          f8x10ShortEdge: { type: Number, default: 4000 },
        },
      },
      customScanOptions: {
        name: { type: String, default: 'Premium Scan Options' },
        defaultScanOption: {
          // make sure this is required if scanning is enabled
          name: { type: String, default: 'Standard Scan' },
          desc: { type: String, default: '' },
        },
        scanOptionB: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: 'Premium Scan' },
          desc: { type: String, default: '' },
        },
        scanOptionC: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
      },
    },
  },
  labServices: [
    // one of these will apply to every single lab service
    {
      service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
      },
      // this is can be changed by checking/unchecking the row
      isEnabled: { type: Boolean, default: false },
      price: { type: Number, default: 0 },
      addOns: {
        hasScanAndSansDev: {
          isAllowed: { type: Boolean, default: false },
          receiveSleeved: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
        hasE6AndHasScanAndSansDev: {
          isAllowed: { type: Boolean, default: false },
          receiveMounted: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
        hasScanOrHasDev: {
          isAllowed: { type: Boolean, default: false },
          returnSleeved: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
        hasE6: {
          isAllowed: { type: Boolean, default: false },
          returnMounted: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
        hasDev: {
          isAllowed: { type: Boolean, default: false },
          push1: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          push2: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          push3: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          pull1: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          pull2: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          pull3: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
        hasScan: {
          isAllowed: { type: Boolean, default: false },
          rawScans: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          scannerB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          scannerC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          scanResB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          scanResC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          scanOptionB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          scanOptionC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
      },
    },
  ],
});

module.exports = mongoose.model('Lab', labSchema);
