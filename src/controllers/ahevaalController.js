const Ahevaal = require('../models/Ahevaal');
const Mandal = require('../models/Mandal');

const createAhevaal = async (req, res) => {
  try {
    const { name, phone, address, specialExp, startTime, endTime } = req.body;

    if (!req.user.teamId)
      return res.status(400).json({ message: 'User is not assigned to any team' });

    const ahevaal = await Ahevaal.create({
      createdBy: req.user.id,
      teamId: req.user.teamId,
      mandalId: req.user.mandalId || null,
      name,
      phone,
      address,
      specialExp,
      startTime,
      endTime,
    });

    res.status(201).json(ahevaal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listMyAhevaals = async (req, res) => {
  try {
    const ahevaals = await Ahevaal.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(ahevaals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listByMandal = async (req, res) => {
  try {
    let mandalIds = [];

    if (req.user.role === 'ADMIN') {
      if (req.params.mandalId) mandalIds = [req.params.mandalId];
      else if (req.user.mandalId) mandalIds = [req.user.mandalId];
      else mandalIds = null; // all
    } else if (req.user.role === 'SANCHALAK') {
      mandalIds = req.user.mandalId ? [req.user.mandalId] : [];
    } else if (req.user.role === 'NIRDESHAK') {
      if (!req.currentUser.xetra) return res.status(400).json({ message: 'xetra not set for user' });
      const mandals = await Mandal.find({ xetra: req.currentUser.xetra }).select('_id');
      mandalIds = mandals.map((m) => m._id.toString());
    } else if (req.user.role === 'NIRIKSHAK') {
      mandalIds = (req.currentUser.assignedMandals || []).map((m) => m.toString());
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // If explicit mandalId param is provided, ensure it is within allowed set
    if (req.params.mandalId) {
      if (mandalIds && !mandalIds.includes(req.params.mandalId) && req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      mandalIds = [req.params.mandalId];
    }

    const filter = {};
    if (mandalIds) {
      if (!mandalIds.length) return res.json([]);
      filter.mandalId = { $in: mandalIds };
    }

    if (req.query.teamId) filter.teamId = req.query.teamId;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
    }

    const ahevaals = await Ahevaal.find(filter).sort({ createdAt: -1 });
    res.json(ahevaals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAhevaal,
  listMyAhevaals,
  listByMandal,
};
