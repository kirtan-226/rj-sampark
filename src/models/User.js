const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ['ADMIN', 'NIRDESHAK', 'SANCHALAK', 'NIRIKSHAK', 'KARYAKAR'],
      default: 'KARYAKAR',
    },

    // For nirdeshak (xetra-level) or generic tagging
    xetra: { type: String },

    // For nirikshak: one or more mandals they supervise
    assignedMandals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mandal' }],

    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: false },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: false },

    isActive: { type: Boolean, default: true },

    // for forgot/reset password
    resetCode: { type: String },
    resetCodeExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
