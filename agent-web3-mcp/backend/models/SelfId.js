const mongoose = require('mongoose');

const SelfIdSchema = new mongoose.Schema({
  uniqueHash: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  proof: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  pubSignals: {
    type: [mongoose.Schema.Types.Mixed],
    required: true
  },
  isValidDetails: {
    isValid: Boolean,
    isMinimumAgeValid: Boolean,
    isOfacValid: Boolean
  },
  forbiddenCountriesList: {
    type: [String],
    default: []
  },
  discloseOutput: mongoose.Schema.Types.Mixed,
  verifiedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => Date.now() + 365 * 24 * 60 * 60 * 1000,
    index: { expires: 0 }
  }
});

module.exports = mongoose.model('SelfId', SelfIdSchema);