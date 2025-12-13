const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Mandal = require('../models/Mandal');

// Helpers
const getNextUserIdForMandal = async (mandalCode = 'U') => {
  const BASE_SEQ = 100; // first user in a mandal starts at XXX100
  const users = await User.find({
    userId: { $regex: `^${mandalCode}\\d+$`, $options: 'i' },
  }).select('userId');

  let maxSeq = 0;
  users.forEach((u) => {
    const digits = u.userId.replace(/^[A-Za-z]+/, '');
    const n = parseInt(digits, 10);
    if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n);
  });
  const nextSeq = maxSeq >= BASE_SEQ ? maxSeq + 1 : BASE_SEQ;
  return mandalCode + String(nextSeq).padStart(3, '0');
};

const getMandalCode = async (mandalId) => {
  if (!mandalId) return null;
  const mandal = await Mandal.findById(mandalId).lean();
  return mandal?.code || null;
};

const passwordFromPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-6) || digits || null;
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

// Create user; will auto-generate userId/password when missing
const createUser = async (req, res) => {
  try {
    const {
      userId: incomingUserId,
      name,
      phone,
      password,
      role,
      mandalId,
      teamId,
      xetra,
      assignedMandals,
    } = req.body;

    const targetMandalId = mandalId || req.user?.mandalId || null;

    // Optional guard: sanchalak cannot create outside own mandal
    if (req.user?.role === 'SANCHALAK' && targetMandalId && req.user.mandalId?.toString() !== targetMandalId.toString()) {
      return res.status(403).json({ message: 'Cannot create user outside your mandal' });
    }

    const existingByPhone = await User.findOne({ phone });
    if (existingByPhone) return res.status(400).json({ message: 'Phone already registered' });

    const mandalCode = await getMandalCode(targetMandalId);
    const userId = incomingUserId || (await getNextUserIdForMandal(mandalCode || 'U'));

    const existingById = await User.findOne({ userId });
    if (existingById) return res.status(400).json({ message: 'userId already registered' });

    const passwordHash = password || passwordFromPhone(phone);

    const user = await User.create({
      userId,
      name,
      phone,
      passwordHash, // still plain per legacy behavior
      role: role || 'KARYAKAR',
      mandalId: targetMandalId,
      teamId: teamId || null,
      xetra: xetra || null,
      assignedMandals: assignedMandals || [],
    });

    res.status(201).json({
      id: user._id,
      userId: user.userId,
      name: user.name,
      phone: user.phone,
      role: user.role,
      mandalId: user.mandalId,
      teamId: user.teamId,
      password: passwordHash,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listUsers = async (req, res) => {
  try {
    const filter = {};
    const allowedMandals = await getAllowedMandalIds(req.currentUser || {});

    if (allowedMandals && allowedMandals.length) {
      filter.mandalId = { $in: allowedMandals };
    } else if (allowedMandals && allowedMandals.length === 0 && req.currentUser?.role !== 'ADMIN') {
      return res.json([]);
    }

    if (req.query.mandalId) filter.mandalId = req.query.mandalId;
    if (req.query.teamId) filter.teamId = req.query.teamId;
    if (req.query.role) filter.role = req.query.role;
    if (req.query.phone) filter.phone = req.query.phone;

    const users = await User.find(filter)
      .select('userId name phone role mandalId teamId xetra assignedMandals')
      .populate('teamId', 'name teamCode');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  res.json(req.currentUser);
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, teamId } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const oldTeamId = user.teamId ? user.teamId.toString() : null;

    // Access control: ADMIN or SANCHALAK (own mandal)
    if (req.user.role !== 'ADMIN') {
      if (req.user.role !== 'SANCHALAK') return res.status(403).json({ message: 'Forbidden' });
      if (user.mandalId && req.user.mandalId && user.mandalId.toString() !== req.user.mandalId.toString())
        return res.status(403).json({ message: 'Cannot edit outside your mandal' });
    }

    if (phone && phone !== user.phone) {
      const exists = await User.findOne({ phone });
      if (exists && exists._id.toString() !== user._id.toString())
        return res.status(400).json({ message: 'Phone already registered' });
      user.phone = phone;
    }
    if (name) user.name = name;

    if (teamId !== undefined) {
      if (teamId && !mongoose.Types.ObjectId.isValid(teamId))
        return res.status(400).json({ message: 'Invalid teamId' });

      if (teamId) {
        const targetTeam = await Team.findById(teamId);
        if (!targetTeam) return res.status(404).json({ message: 'Team not found' });
        if (req.user.role === 'SANCHALAK' && req.user.mandalId && targetTeam.mandalId && targetTeam.mandalId.toString() !== req.user.mandalId.toString())
          return res.status(403).json({ message: 'Cannot move user outside your mandal' });
      }

      // Prevent removing a team leader without reassigning leadership
      if (oldTeamId && teamId?.toString() !== oldTeamId) {
        const existingTeam = await Team.findById(oldTeamId).select('leader');
        if (existingTeam?.leader && existingTeam.leader.toString() === user._id.toString()) {
          return res.status(400).json({ message: 'Cannot remove team leader; assign a new leader first' });
        }
      }

      user.teamId = teamId || null;
    }

    await user.save();

    const newTeamId = user.teamId ? user.teamId.toString() : null;
    if (oldTeamId && oldTeamId !== newTeamId) {
      await Team.updateOne({ _id: oldTeamId }, { $pull: { members: user._id } });
    }
    if (newTeamId && newTeamId !== oldTeamId) {
      await Team.updateMany({ _id: { $ne: newTeamId }, members: user._id }, { $pull: { members: user._id } });
      await Team.updateOne({ _id: newTeamId }, { $addToSet: { members: user._id } });
    }

    res.json({ message: 'User updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.user.role !== 'ADMIN') {
      if (req.user.role !== 'SANCHALAK') return res.status(403).json({ message: 'Forbidden' });
      if (user.mandalId && req.user.mandalId && user.mandalId.toString() !== req.user.mandalId.toString())
        return res.status(403).json({ message: 'Cannot delete outside your mandal' });
    }

    await User.deleteOne({ _id: id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createUser, listUsers, updateUser, deleteUser, getMe };
