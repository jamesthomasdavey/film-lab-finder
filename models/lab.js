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
          name: { type: String, default: 'Large Scans' },
          desc: { type: String, default: '' },
          hasRawByDefault: { type: Boolean, default: false },
        },
        additionalResolutions: [
          {
            isEnabled: { type: Boolean, default: true },
            resId: { type: Number, unique: true, required: true },
            name: { type: String, default: '' },
            desc: { type: String, default: '' },
            hasRawByDefault: { type: Boolean, default: false },
          },
        ],
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
          defaultScanner: {
            scanResolutions: [
              {
                resId: { type: Number, default: 0, unique: true },
                isEnabled: { type: Boolean, default: true },
                price: { type: Number, default: 0 },
              },
            ],
          },
          scannerB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
            scanResolutions: [
              {
                resId: { type: Number, default: 0, unique: true },
                isEnabled: { type: Boolean, default: true },
                price: { type: Number, default: 0 },
              },
            ],
          },
          scannerC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
            scanResolutions: [
              {
                resId: { type: Number, default: 0, unique: true },
                isEnabled: { type: Boolean, default: true },
                price: { type: Number, default: 0 },
              },
            ],
          },
        },
      },
    },
  ],
});

module.exports = mongoose.model('Lab', labSchema);
