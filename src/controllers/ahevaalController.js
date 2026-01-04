const Ahevaal = require('../models/Ahevaal');
const Mandal = require('../models/Mandal');
const Team = require('../models/Team');

const createAhevaal = async (req, res) => {
  try {
    const { name, phone, dob, address, specialExp, startTime, endTime, grade, teamId: teamIdFromBody } = req.body;

    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });

    let teamId = req.user.teamId || teamIdFromBody || null;

    // If teamId is missing, try to resolve by leader/member/teamLogin linkage
    if (!teamId) {
      const team = await Team.findOne({
        $or: [
          { leader: req.user.id },
          { members: req.user.id },
          { teamLoginUser: req.user.id },
        ],
      }).select('_id mandalId');
      if (team) {
        teamId = team._id;
        if (!req.user.mandalId && team.mandalId) req.user.mandalId = team.mandalId;
      }
    }

    if (!teamId) return res.status(400).json({ message: 'User is not assigned to any team' });

    const allowedGrades = ['A', 'B', 'C'];
    const normalizedGrade = typeof grade === 'string' ? grade.toUpperCase() : 'A';
    const safeGrade = allowedGrades.includes(normalizedGrade) ? normalizedGrade : 'A';

    const ahevaal = await Ahevaal.create({
      createdBy: req.user.id,
      teamId,
      mandalId: req.user.mandalId || null,
      name,
      phone,
      dob: dob || null,
      address,
      specialExp,
      startTime,
      endTime,
      grade: safeGrade,
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
      if (req.params.mandalId) {
        mandalIds = [req.params.mandalId];
      } else {
        const allMandals = await Mandal.find({}).select('_id');
        mandalIds = allMandals.map((m) => m._id.toString());
      }
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
