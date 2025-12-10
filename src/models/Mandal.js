const mongoose = require('mongoose');

const mandalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    xetra: { type: String, required: true }, // e.g., Bharuch-1, Bharuch-2, Bharuch-3
    mandal_id: { type: Number, unique: true, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mandal', mandalSchema);
