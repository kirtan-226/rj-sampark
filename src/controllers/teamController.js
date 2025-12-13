const mongoose = require('mongoose');
const Team = require('../models/Team');
const User = require('../models/User');
const Mandal = require('../models/Mandal');

const generateTeamCode = async () => {
  // Find the highest existing teamCode and increment safely to avoid duplicates.
  const last = await Team.findOne({ teamCode: { $regex: /^T\d+$/i } })
    .sort({ teamCode: -1 })
    .select('teamCode')
    .lean();

  if (!last || !last.teamCode) return 'T001';

  const digits = last.teamCode.replace(/^\D+/g, '');
  const num = parseInt(digits || '0', 10) || 0;
  return 'T' + String(num + 1).padStart(3, '0');
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
  if (!mandalId || !mongoose.Types.ObjectId.isValid(mandalId)) return null;
  const mandal = await Mandal.findById(mandalId).lean();
  return mandal?.code || null;
};

// Convert letter suffix (A, B, ..., Z, AA, AB ...) to sequence number and back
const letterToNumber = (letters = '') =>
  letters
    .toUpperCase()
    .split('')
    .reduce((acc, ch) => acc * 26 + (ch.charCodeAt(0) - 64), 0);

const numberToLetter = (num) => {
  let n = num;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out || 'A';
};

const getNextTeamName = async (mandalId, mandalCode) => {
  if (!mandalId || !mandalCode) return null;
  const teams = await Team.find({ mandalId }).select('name').lean();
  let maxSeq = 0;
  const regex = new RegExp(`^${mandalCode}_([A-Z]+)$`, 'i');
  teams.forEach((t) => {
    const match = (t.name || '').match(regex);
    if (match && match[1]) {
      const seq = letterToNumber(match[1]);
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  const nextSeq = maxSeq + 1;
  return `${mandalCode}_${numberToLetter(nextSeq)}`;
};

// Generate next userId like <mandalCode><increment>
const getNextUserIdForMandal = async (mandalCode) => {
  const BASE_SEQ = 100; // first user in a mandal starts at XXX100
  const users = await User.find({ userId: { $regex: `^${mandalCode}\\d+$`, $options: 'i' } }).select('userId');
  let maxSeq = 0;
  users.forEach((u) => {
    const digits = u.userId.replace(/^[A-Za-z]+/, '');
    const n = parseInt(digits, 10);
    if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n);
  });
  const nextSeq = maxSeq >= BASE_SEQ ? maxSeq + 1 : BASE_SEQ;
  return mandalCode + String(nextSeq).padStart(3, '0');
};

const passwordFromPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-6) || digits || null;
};

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

const createUserForMember = async ({ name, phone, mandalId, teamId, mandalCode }) => {
  if (!name || !phone) throw new Error('Member name and phone are required');

  const normalizedPhone = normalizePhone(phone);
  const existingPhone = await User.findOne({ phone: { $in: [phone, normalizedPhone] } });
  if (existingPhone) throw new Error(`Phone already registered: ${phone}`);

  const userId = await getNextUserIdForMandal(mandalCode);
  const password = passwordFromPhone(phone);

  const user = await User.create({
    userId,
    name,
    phone: normalizedPhone || phone,
    passwordHash: password,
    role: 'KARYAKAR',
    mandalId,
    teamId,
  });

  return { user, credentials: { userId, password, name, phone } };
};

const createTeam = async (req, res) => {
  try {
    const {
      name,
      members = [],
      existingMemberIds = [],
      existingMembers = [], // alias from legacy payloads
      mandalId,
      leader: requestedLeader,
    } = req.body;

    // Normalize incoming ids so we don't reject valid payloads if they arrive as comma-separated strings.
    const normalizeIds = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
      return [];
    };

    if (req.user.role !== 'ADMIN' && req.user.role !== 'SANCHALAK')
      return res.status(403).json({ message: 'Forbidden' });

    const targetMandalId = mandalId || req.user.mandalId;
    if (!targetMandalId) return res.status(400).json({ message: 'mandalId is required' });
    if (!mongoose.Types.ObjectId.isValid(targetMandalId)) return res.status(400).json({ message: 'Invalid mandal' });

    if (req.user.role === 'SANCHALAK' && req.user.mandalId?.toString() !== targetMandalId.toString())
      return res.status(403).json({ message: 'Cannot create team outside your mandal' });

    const mandalCode = await getMandalCode(targetMandalId);
    if (!mandalCode) return res.status(400).json({ message: 'Invalid mandal' });

    // Derive team name following nomenclature <mandalCode>_<LetterSequence>
    let normalizedName = typeof name === 'string' ? name.trim() : '';
    const shouldAutoName = req.user.role === 'SANCHALAK' || !normalizedName;
    if (shouldAutoName) {
      normalizedName = await getNextTeamName(targetMandalId, mandalCode);
    }

    if (!normalizedName) return res.status(400).json({ message: 'Team name is required' });

    const existingTeamSameName = await Team.findOne({
      mandalId: targetMandalId,
      name: { $regex: `^${normalizedName}$`, $options: 'i' },
    });
    if (existingTeamSameName) return res.status(400).json({ message: 'Team name already exists for this mandal' });

    const incomingExistingRaw =
      Array.isArray(existingMemberIds) && existingMemberIds.length
        ? existingMemberIds
        : Array.isArray(existingMembers)
          ? existingMembers
          : normalizeIds(existingMemberIds || existingMembers);
    const incomingExisting = normalizeIds(incomingExistingRaw);
    const cleanedExisting = incomingExisting.filter((id) => Boolean(id));

    if ((!Array.isArray(members) || members.length === 0) && cleanedExisting.length === 0)
      return res.status(400).json({ message: 'At least one member is required to create a team' });

    // Validate new members' phones for duplicates and clashes with existing users in the mandal
    const normalizedPhones = (members || []).map((m) => normalizePhone(m.phone)).filter(Boolean);
    const duplicatePhone = normalizedPhones.find((p, idx) => normalizedPhones.indexOf(p) !== idx);
    if (duplicatePhone) return res.status(400).json({ message: `Duplicate phone among new members: ${duplicatePhone}` });

    if (normalizedPhones.length) {
      const phoneClashes = await User.find({
        mandalId: targetMandalId,
        phone: { $in: normalizedPhones },
      })
        .select('name phone')
        .lean();
      if (phoneClashes.length) {
        const phoneList = phoneClashes.map((u) => `${u.name} (${u.phone})`).join(', ');
        return res.status(400).json({ message: `Phone already registered in this mandal: ${phoneList}` });
      }
    }

    const teamCode = await generateTeamCode();

    const team = await Team.create({
      teamCode,
      name: normalizedName,
      leader: null,
      members: [],
      mandalId: targetMandalId,
    });

    // Attach existing unassigned members (by _id)
    const existingUsers = [];
    for (const id of cleanedExisting) {
      if (!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({ message: `Invalid member id: ${id}` });
      // eslint-disable-next-line no-await-in-loop
      const user = await User.findOne({ _id: id, mandalId: targetMandalId });
      if (!user) return res.status(404).json({ message: `Member not found for id ${id}` });
      if (user.teamId) return res.status(400).json({ message: `Member already assigned: ${user.name}` });
      existingUsers.push(user);
    }

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

    const memberIds = [
      ...existingUsers.map((m) => m._id),
      ...createdMemberUsers.map((m) => m.user._id),
    ];
    if (!memberIds.length) return res.status(400).json({ message: 'No members added' });

    team.members = memberIds;
    // default leader: first member created
    team.leader = memberIds[0];
    // if caller sent leader and it belongs to created members, honor it
    if (requestedLeader && memberIds.map(String).includes(String(requestedLeader))) {
      team.leader = requestedLeader;
    }
    // update users with teamId
    await User.updateMany({ _id: { $in: memberIds } }, { teamId: team._id });
    await team.save();

    res.status(201).json({
      team,
      members: createdMemberUsers.map((m) => m.user),
      memberCredentials: createdMemberUsers.map((m) => m.credentials),
      existingMembers: existingUsers.map((u) => ({
        _id: u._id,
        userId: u.userId,
        name: u.name,
        phone: u.phone,
      })),
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

    const previousMembers = (team.members || []).map((m) => m.toString());

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

    const nextMembers = (team.members || []).map((m) => m.toString());

    // Sync user.teamId with new membership list
    const removed = previousMembers.filter((m) => !nextMembers.includes(m));
    const added = nextMembers.filter((m) => !previousMembers.includes(m));

    if (removed.length) await User.updateMany({ _id: { $in: removed } }, { teamId: null });
    if (added.length) {
      // ensure they are not left attached to other teams
      await Team.updateMany({ _id: { $ne: team._id }, members: { $in: added } }, { $pull: { members: { $in: added } } });
      await User.updateMany({ _id: { $in: added } }, { teamId: team._id });
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

    if (team.members && team.members.length) {
      await User.updateMany({ _id: { $in: team.members } }, { teamId: null });
    }

    await Team.deleteOne({ _id: id });
    res.json({ message: 'Team deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTeam, listTeams, listTeamsByMandal, updateTeam, deleteTeam };
