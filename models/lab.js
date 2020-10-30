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
  shipSettings: {
    canReturnUncutNegs: {
      type: Boolean,
      required: true,
      default: true,
    },
    allowDropoff: {
      type: Boolean,
      required: true,
      default: true,
    },
    allowPickup: {
      type: Boolean,
      required: true,
      default: true,
    },
    deliveryCost: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  serviceSettings: {
    develop: {
      isEnabled: {
        type: Boolean,
        default: false,
      },
    },
    scan: {
      isEnabled: {
        type: Boolean,
        default: false,
      },
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
        scannerA: {
          name: String,
          desc: String,
        },
        scannerB: {
          name: String,
          desc: String,
        },
        scannerC: {
          name: String,
          desc: String,
        },
      },
      scanResolutions: {
        f35mmShortEdge: {
          resA: Number,
          resB: Number,
          resC: Number,
        },
        f120ShortEdge: {
          resA: Number,
          resB: Number,
          resC: Number,
        },
        f4x5ShortEdge: {
          resA: Number,
          resB: Number,
          resC: Number,
        },
        f8x10ShortEdge: {
          resA: Number,
          resB: Number,
          resC: Number,
        },
      },
      customScanOptions: {
        a: {
          name: String,
          desc: String,
        },
        b: {
          name: String,
          desc: String,
        },
        c: {
          name: String,
          desc: String,
        },
      },
    },
    print: {
      isEnabled: {
        type: Boolean,
        default: false,
      },
      printers: {
        printerA: {
          name: String,
          desc: String,
        },
        printerB: {
          name: String,
          desc: String,
        },
        printerC: {
          name: String,
          desc: String,
        },
      },
      printDimensions: {
        f35mmShortEdge: {
          dimensionA: Number,
          dimensionB: Number,
          dimensionC: Number,
        },
        f120ShortEdge: {
          dimensionA: Number,
          dimensionB: Number,
          dimensionC: Number,
        },
        f4x5ShortEdge: {
          dimensionA: Number,
          dimensionB: Number,
          dimensionC: Number,
        },
        f8x10ShortEdge: {
          dimensionA: Number,
          dimensionB: Number,
          dimensionC: Number,
        },
      },
      customPrintOptions: {
        a: {
          name: String,
          desc: String,
        },
        b: {
          name: String,
          desc: String,
        },
        c: {
          name: String,
          desc: String,
        },
      },
    },
  },
});

module.exports = mongoose.model('Lab', labSchema);
