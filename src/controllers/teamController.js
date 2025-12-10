const Team = require('../models/Team');
const User = require('../models/User');
const Mandal = require('../models/Mandal');

const generateTeamCode = async () => {
  // very simple incremental code T001, T002,...
  const count = await Team.countDocuments();
  return 'T' + String(count + 1).padStart(3, '0');
};

const getAllowedMandalIds = async (user) => {
  if (user.role === 'ADMIN') return null; // all
  if (user.role === 'SANCHALAK') return user.mandalId ? [user.mandalId] : [];
  if (user.role === 'NIRDESHAK') {
    if (!user.xetra) return [];
    const mandals = await Mandal.find({ xetra: user.xetra }).select('_id');
    return mandals.map((m) => m._id);
  }
  if (user.role === 'NIRIKSHAK') return user.assignedMandals || [];
  return [];
};

const createTeam = async (req, res) => {
  try {
    const { name, leader, members = [], mandalId } = req.body;

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SANCHALAK')
      return res.status(403).json({ message: 'Forbidden' });

    const targetMandalId = mandalId || req.user.mandalId;
    if (!targetMandalId) return res.status(400).json({ message: 'mandalId is required' });

    if (req.user.role === 'SANCHALAK' && req.user.mandalId?.toString() !== targetMandalId.toString())
      return res.status(403).json({ message: 'Cannot create team outside your mandal' });

    const teamCode = await generateTeamCode();

    const team = await Team.create({
      teamCode,
      name,
      leader,
      members,
      mandalId: targetMandalId,
    });

    // Optionally update users with teamId
    await User.updateMany({ _id: { $in: [leader, ...members] } }, { teamId: team._id });

    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listTeams = async (req, res) => {
  try {
    const allowedMandals = await getAllowedMandalIds(req.currentUser);
    const filter = {};
    if (allowedMandals && allowedMandals.length) filter.mandalId = { $in: allowedMandals };
    if (allowedMandals && allowedMandals.length === 0 && req.currentUser.role !== 'ADMIN')
      return res.json([]);
    if (req.query.mandalId) filter.mandalId = req.query.mandalId;

    const teams = await Team.find(filter).populate('leader', 'name phone').populate('members', 'name phone');
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Explicit endpoint to get teams for a specific mandalId
const listTeamsByMandal = async (req, res) => {
  try {
    const { mandalId } = req.params;
    if (!mandalId) return res.status(400).json({ message: 'mandalId is required' });

    const allowedMandals = await getAllowedMandalIds(req.currentUser);
    if (allowedMandals && allowedMandals.length && !allowedMandals.map(String).includes(String(mandalId)))
      return res.status(403).json({ message: 'Forbidden' });

    const teams = await Team.find({ mandalId }).populate('leader', 'name phone').populate('members', 'name phone');
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leader, members, mandalId } = req.body;

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (req.user.role !== 'ADMIN') {
      if (req.user.role !== 'SANCHALAK' || !req.user.mandalId || req.user.mandalId.toString() !== team.mandalId?.toString())
        return res.status(403).json({ message: 'Forbidden' });
    }

    team.name = name ?? team.name;
    team.leader = leader ?? team.leader;
    team.members = members ?? team.members;
    team.mandalId = mandalId ?? team.mandalId;
    await team.save();

    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (req.user.role !== 'ADMIN') {
      if (req.user.role !== 'SANCHALAK' || !req.user.mandalId || req.user.mandalId.toString() !== team.mandalId?.toString())
        return res.status(403).json({ message: 'Forbidden' });
    }

    await Team.deleteOne({ _id: id });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTeam, listTeams, listTeamsByMandal, updateTeam, deleteTeam };
