const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  description: { type: String, default: '' },
  ownedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  settings: {
    // shipSettings: {
    // allowDropoff: { type: Boolean, default: true },
    // allowPickup: { type: Boolean, default: true },
    // shippingPrice: { type: Number, default: 10 },
    // },
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
        scannerD: {
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
    printSettings: {
      isEnabled: { type: Boolean, default: false },
      printSizes: {
        defaultPrintSize: {
          // make sure this is required if printing is enabled
          name: { type: String, default: 'Medium Prints' },
          sfShortEdge: { type: Number, default: 4 },
          mfShortEdge: { type: Number, default: 4 },
          f4x5ShortEdge: { type: Number, default: 4 },
          f8x10ShortEdge: { type: Number, default: 4 },
        },
        printSizeB: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: 'Large Prints' },
          sfShortEdge: { type: Number, default: 5 },
          mfShortEdge: { type: Number, default: 5 },
          f4x5ShortEdge: { type: Number, default: 5 },
          f8x10ShortEdge: { type: Number, default: 5 },
        },
        printSizeC: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: 'X-Large Prints' },
          sfShortEdge: { type: Number, default: 8 },
          mfShortEdge: { type: Number, default: 8 },
          f4x5ShortEdge: { type: Number, default: 8 },
          f8x10ShortEdge: { type: Number, default: 8 },
        },
      },
      customPrintOptions: {
        defaultPrintOption: {
          // make sure this is required if printing is enabled
          name: { type: String, default: 'Glossy' },
          desc: { type: String, default: '' },
        },
        printOptionB: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: 'Matte' },
          desc: { type: String, default: '' },
        },
        printOptionC: {
          isEnabled: { type: Boolean, default: false },
          name: { type: String, default: '' },
          desc: { type: String, default: '' },
        },
      },
    },
  },
  labServices: [
    // each of these will apply to every single lab service
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
        ship: {
          // isAllowed: { type: Boolean, default: true },
          returnSleeved: {
            isAllowed: { type: Boolean, default: false },
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          returnMounted: {
            isAllowed: { type: Boolean, default: false },
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
        dev: {
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
        scan: {
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
          scannerD: {
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
        print: {
          isAllowed: { type: Boolean, default: false },
          printSizeB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          printSizeC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          printOptionB: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
          printOptionC: {
            isEnabled: { type: Boolean, default: false },
            price: { type: Number, default: 0 },
          },
        },
      },
    },
    // ^^^ each of these will apply to every single lab service
  ],
});

module.exports = mongoose.model('Lab', labSchema);
