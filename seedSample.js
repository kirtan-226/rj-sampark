const mongoose = require('mongoose');
require('dotenv').config();

const Mandal = require('./src/models/Mandal');
const User = require('./src/models/User');
const Team = require('./src/models/Team');
const Ahevaal = require('./src/models/Ahevaal');

const SAMPLE_MANDALS = [
  { code: 'RK', name: 'Radhakrushna', xetra: 'Xetra-1', mandal_id: 101 },
  { code: 'NK', name: 'Narayankunj', xetra: 'Xetra-1', mandal_id: 102 },
  { code: 'SJ', name: 'Sahjanand', xetra: 'Xetra-2', mandal_id: 103 },
];

const SAMPLE_USERS = [
  { userId: 'ADMIN001', name: 'Admin User', phone: '9000000001', role: 'ADMIN', passwordHash: 'Admin@123' },
  { userId: 'NIRDESH001', name: 'Nirdeshak Xetra-1', phone: '9000000002', role: 'NIRDESHAK', passwordHash: 'Pass@123', xetra: 'Xetra-1' },
  { userId: 'NIRIK001', name: 'Nirikshak RK/NK', phone: '9000000003', role: 'NIRIKSHAK', passwordHash: 'Pass@123', assignedCodes: ['RK', 'NK'] },
  { userId: 'RK-SANCH', name: 'Sanchalak RK', phone: '9000000004', role: 'SANCHALAK', passwordHash: 'Pass@123', mandalCode: 'RK' },
  { userId: 'NK-SANCH', name: 'Sanchalak NK', phone: '9000000005', role: 'SANCHALAK', passwordHash: 'Pass@123', mandalCode: 'NK' },
  { userId: 'RK-TLEAD', name: 'Alpha Leader', phone: '9000000006', role: 'KARYAKAR', passwordHash: 'Pass@123', mandalCode: 'RK' },
  { userId: 'NK-TLEAD', name: 'Beta Leader', phone: '9000000007', role: 'KARYAKAR', passwordHash: 'Pass@123', mandalCode: 'NK' },
  { userId: 'NK-MEM1', name: 'Beta Member 1', phone: '9000000008', role: 'KARYAKAR', passwordHash: 'Pass@123', mandalCode: 'NK' },
  { userId: 'NK-MEM2', name: 'Beta Member 2', phone: '9000000009', role: 'KARYAKAR', passwordHash: 'Pass@123', mandalCode: 'NK' },
  { userId: 'SJ-KARYA', name: 'Unassigned SJ Karyakar', phone: '9000000010', role: 'KARYAKAR', passwordHash: 'Pass@123', mandalCode: 'SJ' },
];

const SAMPLE_TEAMS = [
  {
    teamCode: 'T100',
    name: 'Alpha (single-member, leader auto)',
    mandalCode: 'RK',
    memberUserIds: ['RK-TLEAD'],
  },
  {
    teamCode: 'T101',
    name: 'Beta (multi-member, leader override)',
    mandalCode: 'NK',
    memberUserIds: ['NK-TLEAD', 'NK-MEM1', 'NK-MEM2'],
    leaderUserId: 'NK-MEM2',
  },
];

const SAMPLE_AHEVAALS = [
  { name: 'Patel Family', phone: '9111111111', address: 'Bharuch, GJ', teamCode: 'T100', createdByUserId: 'RK-TLEAD' },
  { name: 'Shah Family', phone: '9222222222', address: 'Narayankunj, GJ', teamCode: 'T101', createdByUserId: 'NK-MEM1' },
  { name: 'Mehta Family', phone: '9333333333', address: 'Narayankunj, GJ', teamCode: 'T101', createdByUserId: 'NK-MEM2' },
];

(async function seedSample() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');
    console.log('Connecting to Mongo...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected');

    await Mandal.deleteMany({ code: { $in: SAMPLE_MANDALS.map((m) => m.code) } });
    await User.deleteMany({ userId: { $in: SAMPLE_USERS.map((u) => u.userId) } });
    await Team.deleteMany({ teamCode: { $in: SAMPLE_TEAMS.map((t) => t.teamCode) } });
    await Ahevaal.deleteMany({ name: { $in: SAMPLE_AHEVAALS.map((a) => a.name) } });

    const mandalMap = {};
    for (const m of SAMPLE_MANDALS) {
      const mandal = await Mandal.create(m);
      mandalMap[m.code] = mandal._id;
    }

    const userMap = {};
    for (const u of SAMPLE_USERS) {
      const mandalId = u.mandalCode ? mandalMap[u.mandalCode] : null;
      const assignedMandals = (u.assignedCodes || []).map((c) => mandalMap[c]).filter(Boolean);
      const created = await User.create({
        userId: u.userId,
        name: u.name,
        phone: u.phone,
        passwordHash: u.passwordHash,
        role: u.role,
        mandalId,
        xetra: u.xetra || null,
        assignedMandals,
      });
      userMap[u.userId] = created._id;
    }

    const teamMap = {};
    for (const t of SAMPLE_TEAMS) {
      const mandalId = mandalMap[t.mandalCode];
      const memberIds = (t.memberUserIds || []).map((id) => userMap[id]).filter(Boolean);
      if (!mandalId || !memberIds.length) {
        console.log(`Skipping team ${t.teamCode}: mandal/member missing`);
        continue;
      }
      const leader = t.leaderUserId ? userMap[t.leaderUserId] : memberIds[0];
      const team = await Team.create({
        teamCode: t.teamCode,
        name: t.name,
        mandalId,
        members: memberIds,
        leader,
      });
      teamMap[t.teamCode] = team._id;
      await User.updateMany({ _id: { $in: memberIds } }, { teamId: team._id });
    }

    for (const a of SAMPLE_AHEVAALS) {
      const teamId = teamMap[a.teamCode];
      const createdBy = userMap[a.createdByUserId];
      const mandalId = teamId ? (await Team.findById(teamId).select('mandalId')).mandalId : null;
      if (!teamId || !createdBy || !mandalId) {
        console.log(`Skipping ahevaal ${a.name}: missing refs`);
        continue;
      }
      await Ahevaal.create({
        name: a.name,
        phone: a.phone,
        address: a.address,
        teamId,
        mandalId,
        createdBy,
      });
    }

    console.log('Sample seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
})();
