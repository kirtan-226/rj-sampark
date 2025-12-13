const mongoose = require('mongoose');

const ahevaalSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal' },

    name: { type: String, required: true }, // Main field person's name
    phone: { type: String, required: true },
    dob: { type: Date }, // Date of birth (optional)
    address: { type: String },
    specialExp: { type: String }, // any special experience
    grade: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
    startTime: { type: Date },
    endTime: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ahevaal', ahevaalSchema);
