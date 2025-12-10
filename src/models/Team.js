const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    teamCode: { type: String, required: true, unique: true }, // e.g. T001
    name: { type: String, required: true },

    mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal' },

    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Team', teamSchema);
