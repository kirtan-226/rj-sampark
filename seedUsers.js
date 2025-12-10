// seedUsers.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Mandal = require('./src/models/Mandal');
const Team = require('./src/models/Team');
const Ahevaal = require('./src/models/Ahevaal');

const xetraById = { 1: 'Bharuch-1', 2: 'Bharuch-2', 3: 'Bharuch-3' };

const mandalsFromSql = [
  { name: 'Radhakrushna', code: 'RK', xetra: xetraById[1] },
  { name: 'Narayankunj', code: 'NK', xetra: xetraById[1] },
  { name: 'Maitrinagar', code: 'MT', xetra: xetraById[1] },
  { name: 'Sahjanand', code: 'SJ', xetra: xetraById[1] },
  { name: 'Narmadanagar', code: 'NN', xetra: xetraById[1] },
  { name: 'Surbhi', code: 'SB', xetra: xetraById[1] },
  { name: 'Vadadla', code: 'VD', xetra: xetraById[3] },
  { name: 'Zadeshwar', code: 'ZD', xetra: xetraById[1] },
  { name: 'Manasnagar', code: 'MN', xetra: xetraById[1] },
  { name: 'Shriniketan', code: 'SK', xetra: xetraById[1] },
  { name: 'Akshardham', code: 'AD', xetra: xetraById[1] },
  { name: 'Pramukh Park', code: 'PP', xetra: xetraById[1] },
  { name: 'Vaibhav', code: 'VB', xetra: xetraById[1] },
  { name: 'Mandir', code: 'MR', xetra: xetraById[1] },
  { name: 'Chakla', code: 'CH', xetra: xetraById[2] },
  { name: 'ShaktiNath', code: 'SN', xetra: xetraById[2] },
  { name: 'Krushna Nagar', code: 'KN', xetra: xetraById[2] },
  { name: 'Ali Pura', code: 'AL', xetra: xetraById[2] },
  { name: 'Mangal Tirth', code: 'ML', xetra: xetraById[2] },
  { name: 'Narmada Darshan', code: 'ND', xetra: xetraById[2] },
  { name: 'Ambika Nagar', code: 'AM', xetra: xetraById[2] },
  { name: 'Ganesh Township', code: 'GT', xetra: xetraById[2] },
  { name: 'ShreejiKrupa', code: 'SR', xetra: xetraById[2] },
  { name: 'Mangalya', code: 'MA', xetra: xetraById[2] },
  { name: 'Chavaj', code: 'CV', xetra: xetraById[2] },
  { name: 'Pritamnagar', code: 'PT', xetra: xetraById[2] },
  { name: 'Vejalpur', code: 'VJ', xetra: xetraById[2] },
  { name: 'Ashray', code: 'AS', xetra: xetraById[2] },
  { name: 'Mangleshwar', code: 'MG', xetra: xetraById[3] },
  { name: 'Shukaltirth', code: 'ST', xetra: xetraById[3] },
  { name: 'Srijisadan', code: 'SS', xetra: xetraById[3] },
  { name: 'Sriji pravesh', code: 'SP', xetra: xetraById[3] },
  { name: 'Nikora', code: 'NI', xetra: xetraById[3] },
  { name: 'Tavra', code: 'TV', xetra: xetraById[3] },
  { name: 'Golden Residency', code: 'GR', xetra: xetraById[3] },
  { name: 'Mulad', code: 'MU', xetra: xetraById[3] },
  { name: 'Govali', code: 'GV', xetra: xetraById[3] },
  { name: 'Angareshwar', code: 'AG', xetra: xetraById[3] },
  { name: 'Riddhi Siddhi', code: 'RS', xetra: xetraById[3] },
  { name: 'Umra', code: 'UM', xetra: xetraById[3] },
  { name: 'Karmali', code: 'KR', xetra: xetraById[3] },
  { name: 'Karjan', code: 'KJ', xetra: xetraById[3] },
  { name: 'Osara', code: 'OS', xetra: xetraById[3] },
];

const users = [
  // Admin
  { name: 'Admin', phone: '9990001111', password: 'Admin@123', role: 'ADMIN', userId: 'ADMIN001' },

  // Nirdeshak (xetra-scoped, read-only)
  {
    name: 'Nirdeshak Bharuch-1',
    phone: '9990002001',
    password: 'Pass@123',
    role: 'NIRDESHAK',
    xetra: 'Bharuch-1',
    userId: 'NIRDESHAK001',
  },

  // Sanchalak (crud in their mandal) – mandalCode + seq -> userId like RK100
  { name: 'Sanchalak RK Mandal', phone: '9990003001', password: 'Pass@123', role: 'SANCHALAK', mandalCode: 'RK', seq: 100 },

  // Nirikshak (read-only for specific mandals)
  { name: 'Nirikshak RK', phone: '9990004001', password: 'Pass@123', role: 'NIRIKSHAK', assignedCodes: ['RK'], seq: 101 },

  // Karyakar (ahevaal submitter)
  { name: 'Karyakar RK', phone: '9990005001', password: 'Pass@123', role: 'KARYAKAR', mandalCode: 'RK', seq: 102 },
  { name: 'Team Leader RK', phone: '9990005002', password: 'Pass@123', role: 'KARYAKAR', mandalCode: 'RK', seq: 103 },
  { name: 'Team Member RK', phone: '9990005003', password: 'Pass@123', role: 'KARYAKAR', mandalCode: 'RK', seq: 104 },
  { name: 'Team Leader NK', phone: '9990005004', password: 'Pass@123', role: 'KARYAKAR', mandalCode: 'NK', seq: 200 },
  { name: 'Team Member NK', phone: '9990005005', password: 'Pass@123', role: 'KARYAKAR', mandalCode: 'NK', seq: 201 },
];

(async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Seeding mandals and users...');

    // Upsert mandals from SQL and attach sequential mandal_id (1...N)
    let mandalSeq = 1;
    const mandalOps = mandalsFromSql.map((m) =>
      Mandal.findOneAndUpdate(
        { code: m.code },
        { ...m, mandal_id: mandalSeq++ },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
    );
    const mandals = await Promise.all(mandalOps);
    const mandalMap = {};
    mandals.forEach((m) => (mandalMap[m.code] = m._id));

    const userMap = {};
    for (const u of users) {
      const baseCode = u.mandalCode || u.assignedCodes?.[0];
      const userId = baseCode ? `${baseCode}${String(u.seq || 1).padStart(3, '0')}` : u.userId;
      const mandalId = u.mandalCode ? mandalMap[u.mandalCode] : null;
      const assignedMandals =
        u.assignedCodes?.map((c) => mandalMap[c]).filter(Boolean) || [];

      const existing = await User.findOne({ $or: [{ phone: u.phone }, { userId }] });
      if (existing) {
        console.log(`User ${userId} exists, skipping.`);
        userMap[userId] = existing._id;
        continue;
      }

      const created = await User.create({
        userId,
        name: u.name,
        phone: u.phone,
        passwordHash: u.password, // plain text per your setup
        role: u.role,
        mandalId,
        xetra: u.xetra || null,
        assignedMandals,
      });

      userMap[userId] = created._id;
      console.log(`Created user ${userId} (${u.role})`);
    }

    // Sample teams (each tied to a single mandal)
    const teams = [
      {
        teamCode: 'T001',
        name: 'RK Outreach Team',
        mandalCode: 'RK',
        leaderUserId: 'RK103',
        memberUserIds: ['RK104', 'RK102'],
      },
      {
        teamCode: 'T002',
        name: 'NK Outreach Team',
        mandalCode: 'NK',
        leaderUserId: 'NK200',
        memberUserIds: ['NK201'],
      },
    ];

    const teamMap = {};
    for (const t of teams) {
      const mandalId = mandalMap[t.mandalCode];
      const leaderId = userMap[t.leaderUserId];
      const members = t.memberUserIds.map((id) => userMap[id]).filter(Boolean);

      if (!mandalId || !leaderId) {
        console.log(`Skipping team ${t.teamCode}: missing mandal/leader`);
        continue;
      }

      const existingTeam = await Team.findOne({ teamCode: t.teamCode });
      if (existingTeam) {
        console.log(`Team ${t.teamCode} exists, skipping.`);
        teamMap[t.teamCode] = existingTeam._id;
        if (leaderId || members.length) {
          await User.updateMany(
            { _id: { $in: [leaderId, ...members].filter(Boolean) } },
            { teamId: existingTeam._id }
          );
        }
        continue;
      }

      const createdTeam = await Team.create({
        teamCode: t.teamCode,
        name: t.name,
        mandalId,
        leader: leaderId,
        members,
      });

      teamMap[t.teamCode] = createdTeam._id;
      if (leaderId || members.length) {
        await User.updateMany(
          { _id: { $in: [leaderId, ...members].filter(Boolean) } },
          { teamId: createdTeam._id }
        );
      }
      console.log(`Created team ${t.teamCode}`);
    }

    // Sample ahevaals (family-level info, tied to team and mandal)
    const ahevaals = [
      {
        name: 'Patel Family',
        phone: '9000007001',
        address: '12, Shanti Nagar, Bharuch',
        teamCode: 'T001',
        mandalCode: 'RK',
        createdByUserId: 'RK102',
      },
      {
        name: 'Shah Family',
        phone: '9000007002',
        address: '24, Green Park, Bharuch',
        teamCode: 'T001',
        mandalCode: 'RK',
        createdByUserId: 'RK104',
      },
      {
        name: 'Mehta Family',
        phone: '9000007003',
        address: '8, Ambica Society, Bharuch',
        teamCode: 'T002',
        mandalCode: 'NK',
        createdByUserId: 'NK201',
      },
    ];

    for (const a of ahevaals) {
      const teamId = teamMap[a.teamCode];
      const mandalId = mandalMap[a.mandalCode];
      const createdBy = userMap[a.createdByUserId];

      if (!teamId || !mandalId || !createdBy) {
        console.log(`Skipping ahevaal for ${a.name}: missing team/mandal/creator`);
        continue;
      }

      const exists = await Ahevaal.findOne({ name: a.name, phone: a.phone, teamId });
      if (exists) {
        console.log(`Ahevaal for ${a.name} exists, skipping.`);
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
      console.log(`Created ahevaal for ${a.name}`);
    }

    console.log('Seeding finished');
    process.exit(0);
  } catch (err) {
    console.error('Error while seeding:', err);
    process.exit(1);
  }
})();
