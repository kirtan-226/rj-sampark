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

const getMandalCode = async (mandalId) => {
  const mandal = await Mandal.findById(mandalId).lean();
  return mandal?.code || null;
};

// Generate next userId like <mandalCode><increment>
const getNextUserIdForMandal = async (mandalCode) => {
  const users = await User.find({ userId: { $regex: `^${mandalCode}\\d+$`, $options: 'i' } }).select('userId');
  let maxSeq = 0;
  users.forEach((u) => {
    const digits = u.userId.replace(/^[A-Za-z]+/, '');
    const n = parseInt(digits, 10);
    if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n);
  });
  return mandalCode + String(maxSeq + 1).padStart(3, '0');
};

const passwordFromPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-6) || digits || null;
};

const createUserForMember = async ({ name, phone, mandalId, teamId, mandalCode }) => {
  if (!name || !phone) throw new Error('Member name and phone are required');

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) throw new Error(`Phone already registered: ${phone}`);

  const userId = await getNextUserIdForMandal(mandalCode);
  const password = passwordFromPhone(phone);

  const user = await User.create({
    userId,
    name,
    phone,
    passwordHash: password,
    role: 'KARYAKAR',
    mandalId,
    teamId,
  });

  return { user, credentials: { userId, password, name, phone } };
};

const createTeamLoginUser = async ({ teamName, mandalId, teamId, mandalCode }) => {
  const userId = await getNextUserIdForMandal(mandalCode);

  // generate a numeric 10-digit phone placeholder to satisfy schema uniqueness
  let phone;
  let attempts = 0;
  while (!phone && attempts < 5) {
    const candidate = String(8000000000 + Math.floor(Math.random() * 999999)).padEnd(10, '0');
    // ensure unique phone
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.findOne({ phone: candidate });
    if (!exists) phone = candidate;
    attempts += 1;
  }
  if (!phone) throw new Error('Unable to generate unique phone for team login');

  const password = passwordFromPhone(phone);

  const user = await User.create({
    userId,
    name: `${teamName} Team Login`,
    phone,
    passwordHash: password,
    role: 'KARYAKAR',
    mandalId,
    teamId,
  });

  return { user, credentials: { userId, password } };
};

const createTeam = async (req, res) => {
  try {
    const { name, members = [], mandalId } = req.body;

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SANCHALAK')
      return res.status(403).json({ message: 'Forbidden' });

    const targetMandalId = mandalId || req.user.mandalId;
    if (!targetMandalId) return res.status(400).json({ message: 'mandalId is required' });

    if (req.user.role === 'SANCHALAK' && req.user.mandalId?.toString() !== targetMandalId.toString())
      return res.status(403).json({ message: 'Cannot create team outside your mandal' });

    const mandalCode = await getMandalCode(targetMandalId);
    if (!mandalCode) return res.status(400).json({ message: 'Invalid mandal' });

    const teamCode = await generateTeamCode();

    const team = await Team.create({
      teamCode,
      name,
      leader: req.user?.id || null, // will update below once members created
      members: [],
      mandalId: targetMandalId,
    });

    const createdMemberUsers = [];
    for (const m of members) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const { user, credentials } = await createUserForMember({
          name: m.name,
          phone: m.phone,
          mandalId: targetMandalId,
          teamId: team._id,
          mandalCode,
        });
        createdMemberUsers.push({ user, credentials });
      } catch (err) {
        console.error('create member error:', err.message);
        return res.status(400).json({ message: err.message });
      }
    }

    const memberIds = createdMemberUsers.map((m) => m.user._id);
    if (memberIds.length) {
      team.members = memberIds;
      team.leader = memberIds[0]; // first member as leader
    } else {
      team.leader = req.user.id; // fallback to creator
    }

    const { user: teamLoginUser, credentials: teamLoginCreds } = await createTeamLoginUser({
      teamName: name,
      mandalId: targetMandalId,
      teamId: team._id,
      mandalCode,
    });

    team.teamLoginUserId = teamLoginCreds.userId;
    team.teamLoginPassword = teamLoginCreds.password;
    team.teamLoginUser = teamLoginUser._id;
    await team.save();

    res.status(201).json({
      team,
      members: createdMemberUsers.map((m) => m.user),
      memberCredentials: createdMemberUsers.map((m) => m.credentials),
      teamLogin: teamLoginCreds,
    });
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

    const teams = await Team.find(filter)
      .populate('leader', 'name phone userId')
      .populate('members', 'name phone userId')
      .populate('teamLoginUser', 'userId');
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

    const teams = await Team.find({ mandalId })
      .populate('leader', 'name phone userId')
      .populate('members', 'name phone userId')
      .populate('teamLoginUser', 'userId');
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, leader, members, mandalId, newMembers = [] } = req.body;

    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (req.user.role !== 'ADMIN') {
      if (req.user.role !== 'SANCHALAK' || !req.user.mandalId || req.user.mandalId.toString() !== team.mandalId?.toString())
        return res.status(403).json({ message: 'Forbidden' });
    }

    team.name = name ?? team.name;
    team.leader = leader ?? team.leader;
    if (Array.isArray(members)) team.members = members;
    team.mandalId = mandalId ?? team.mandalId;

    // handle adding new members with name/phone (auto user creation)
    if (Array.isArray(newMembers) && newMembers.length) {
      const mandalCode = await getMandalCode(team.mandalId);
      if (!mandalCode) return res.status(400).json({ message: 'Invalid mandal' });

      const createdMemberUsers = [];
      for (const m of newMembers) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const { user } = await createUserForMember({
            name: m.name,
            phone: m.phone,
            mandalId: team.mandalId,
            teamId: team._id,
            mandalCode,
          });
          createdMemberUsers.push(user._id);
        } catch (err) {
          console.error('create new member error:', err.message);
          return res.status(400).json({ message: err.message });
        }
      }
      team.members = [...new Set([...(team.members || []), ...createdMemberUsers])];
    }

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
