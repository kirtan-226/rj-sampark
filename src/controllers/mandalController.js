const Mandal = require('../models/Mandal');

// ADMIN: create mandal
const createMandal = async (req, res) => {
  try {
    const { name, code, xetra } = req.body;
    if (!name || !code || !xetra) return res.status(400).json({ message: 'name, code, xetra are required' });

    const existing = await Mandal.findOne({ $or: [{ code }, { name }] });
    if (existing) return res.status(400).json({ message: 'Mandal with same name or code already exists' });

    const mandal = await Mandal.create({ name, code, xetra });
    res.status(201).json(mandal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List mandals by scope
const listMandals = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'NIRDESHAK') {
      if (!req.currentUser.xetra) return res.status(400).json({ message: 'xetra not set for user' });
      filter.xetra = req.currentUser.xetra;
    } else if (req.user.role === 'NIRIKSHAK') {
      if (!req.currentUser.assignedMandals || !req.currentUser.assignedMandals.length)
        return res.json([]);
      filter._id = { $in: req.currentUser.assignedMandals };
    } else if (req.user.role === 'SANCHALAK') {
      if (req.currentUser.mandalId) filter._id = req.currentUser.mandalId;
    }

    const mandals = await Mandal.find(filter).sort({ code: 1 });
    res.json(mandals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: update
const updateMandal = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, xetra } = req.body;
    const mandal = await Mandal.findByIdAndUpdate(
      id,
      { name, code, xetra },
      { new: true }
    );
    if (!mandal) return res.status(404).json({ message: 'Mandal not found' });
    res.json(mandal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: delete
const deleteMandal = async (req, res) => {
  try {
    const { id } = req.params;
    const mandal = await Mandal.findByIdAndDelete(id);
    if (!mandal) return res.status(404).json({ message: 'Mandal not found' });
    res.json({ message: 'Mandal deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createMandal, listMandals, updateMandal, deleteMandal };
