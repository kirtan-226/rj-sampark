const User = require('../models/User');

const createUser = async (req, res) => {
  try {
    const { userId, name, phone, password, role, mandalId, teamId, xetra, assignedMandals } = req.body;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const existingById = await User.findOne({ userId });
    if (existingById) return res.status(400).json({ message: 'userId already registered' });

    const existingByPhone = await User.findOne({ phone });
    if (existingByPhone) return res.status(400).json({ message: 'Phone already registered' });

    const user = await User.create({
      userId,
      name,
      phone,
      passwordHash: password,
      role: role || 'KARYAKAR',
      mandalId: mandalId || req.user.mandalId || null,
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
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  res.json(req.currentUser);
};

module.exports = { createUser, getMe };
