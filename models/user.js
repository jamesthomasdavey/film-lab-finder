const mongoose = require('mongoose');
const crypto = require('crypto');
const { v1: uuidv1 } = require('uuid');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      trim: true,
      required: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      trim: true,
    },
    salt: String,
    role: {
      type: Number,
      default: 0,
    },
    history: {
      type: Array,
      default: [],
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: false,
    },
    cart: {
      lab: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lab',
        required: false,
      },
      filmRolls: [
        {
          filmStock: String,
          notes: String,
          service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Service',
          },
          addOns: {
            hasScanAndSansDev: {
              receiveSleeved: {
                type: Boolean,
                default: false,
              },
            },
            hasE6AndHasScanAndSansDev: {
              receiveMounted: {
                type: Boolean,
                default: false,
              },
            },
            hasScanOrHasDev: {
              returnSleeved: {
                type: Boolean,
                default: false,
              },
            },
            hasE6: {
              returnMounted: {
                type: Boolean,
                default: false,
              },
            },
            hasDev: {
              push1: {
                type: Boolean,
                default: false,
              },
              push2: {
                type: Boolean,
                default: false,
              },
              push3: {
                type: Boolean,
                default: false,
              },
              pull1: {
                type: Boolean,
                default: false,
              },
              pull2: {
                type: Boolean,
                default: false,
              },
              pull3: {
                type: Boolean,
                default: false,
              },
            },
            hasScan: {
              rawScans: {
                type: Boolean,
                default: false,
              },
            },
          },
          quantity: {
            type: Number,
            default: 1,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

// virtual field
userSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

userSchema.methods = {
  authenticate: function (plainText) {
    // return true if a match, false if not
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function (password) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },
};

module.exports = mongoose.model('User', userSchema);
