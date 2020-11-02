const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  ownedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  labServices: [
    // each of these will apply to every single lab service
    {
      referencedService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true,
      },
      isEnabled: { type: Boolean, default: false },
      price: { type: Number, default: 0 },
      addOns: {
        ship: {
          isAllowed: { type: Boolean, default: true },
          returnSleeved: {
            isEnabled: { type: Boolean },
            price: { type: Number, default: 0 },
          },
          returnMounted: {
            isEnabled: { type: Boolean },
            price: { type: Number, default: 0 },
          },
        },
        dev: {
          isAllowed: Boolean,
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
        scan: {
          isAllowed: Boolean,
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
          customScanB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          customScanC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
        print: {
          isAllowed: Boolean,
          printDimensionB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          printDimensionC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          customPrintB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          customPrintC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
      },
    },
    // ^^^ each of these will apply to every single lab service
  ],
  shipSettings: {
    canReturnUncutNegs: { type: Boolean, default: true },
    allowDropoff: { type: Boolean, default: true },
    allowPickup: { type: Boolean, default: true },
    shippingPrice: { type: Number, default: 10 },
  },
  serviceSettings: {
    dev: {
      isEnabled: { type: Boolean, default: false },
    },
    scan: {
      isEnabled: { type: Boolean, default: false },
      rawByOrder: {
        isEnabled: { type: Boolean, default: false },
        price: { type: Number, default: 10 },
      },
      scanners: {
        defaultScanner: {
          name: { type: String, default: 'Noritsu' },
          desc: { type: String, default: '' },
        },
        scannerB: {
          name: { type: String, default: 'Fuji Frontier' },
          desc: { type: String, default: '' },
        },
        scannerC: {
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
        scannerD: {
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
      },
      scanResolutions: {
        sfShortEdge: {
          defaultRes: { type: Number, default: 1002 },
          resB: { type: Number, default: 2000 },
          resC: { type: Number, default: 4000 },
        },
        mfShortEdge: {
          defaultRes: { type: Number, default: 1002 },
          resB: { type: Number, default: 2000 },
          resC: { type: Number, default: 4000 },
        },
        f4x5ShortEdge: {
          defaultRes: { type: Number, default: 1002 },
          resB: { type: Number, default: 2000 },
          resC: { type: Number, default: 4000 },
        },
        f8x10ShortEdge: {
          defaultRes: { type: Number, default: 1002 },
          resB: { type: Number, default: 2000 },
          resC: { type: Number, default: 4000 },
        },
      },
      customScanOptions: {
        a: {
          name: { type: String, default: 'Standard' },
          desc: { type: String, default: '' },
        },
        b: {
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
        c: {
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
      },
    },
    print: {
      isEnabled: { type: Boolean, default: false },
      printDimensions: {
        sfShortEdge: {
          defaultDimension: { type: Number, default: 4 },
          dimensionB: { type: Number, default: 5 },
          dimensionC: { type: Number, default: 8 },
        },
        mfShortEdge: {
          defaultDimension: { type: Number, default: 4 },
          dimensionB: { type: Number, default: 5 },
          dimensionC: { type: Number, default: 8 },
        },
        f4x5ShortEdge: {
          defaultDimension: { type: Number, default: 4 },
          dimensionB: { type: Number, default: 5 },
          dimensionC: { type: Number, default: 8 },
        },
        f8x10ShortEdge: {
          defaultDimension: { type: Number, default: 4 },
          dimensionB: { type: Number, default: 5 },
          dimensionC: { type: Number, default: 8 },
        },
      },
      customPrintOptions: {
        a: {
          name: { type: String, default: 'Standard' },
          desc: { type: String, default: '' },
        },
        b: {
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
        c: {
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
      },
    },
  },
});

module.exports = mongoose.model('Lab', labSchema);
