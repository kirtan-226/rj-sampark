// seedUsers.js (Sanchalak-only seeding)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Mandal = require('./src/models/Mandal');

const xetraById = { 1: 'Bharuch-1', 2: 'Bharuch-2', 3: 'Bharuch-3' };
const BASE_SEQ = 100; // first user in a mandal starts at XXX100
const BASE_PHONE = 9000007000; // unique phone generator

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

// Determine the next userId for a mandal code (cached per code)
const getNextUserIdForCode = async (code, cache) => {
  if (!code) return null;

  if (!cache[code]) {
    const usersWithCode = await User.find({ userId: { $regex: `^${code}\\d+$`, $options: 'i' } }).select('userId');
    let maxSeq = 0;
    usersWithCode.forEach((u) => {
      const digits = u.userId.replace(/^[A-Za-z]+/, '');
      const n = parseInt(digits, 10);
      if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n);
    });
    cache[code] = Math.max(maxSeq, BASE_SEQ - 1);
  }

  cache[code] += 1;
  if (cache[code] < BASE_SEQ) cache[code] = BASE_SEQ;
  return `${code}${String(cache[code]).padStart(3, '0')}`;
};

(async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Seeding mandals and Sanchalaks...');

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

    // Ensure a single admin user exists
    const adminUser = {
      userId: 'ADMIN001',
      name: 'Admin',
      phone: '9990001111',
      password: 'Admin@123',
      role: 'ADMIN',
    };
    const existingAdmin = await User.findOne({
      $or: [{ userId: adminUser.userId }, { phone: adminUser.phone }],
    });
    if (existingAdmin) {
      console.log(`Admin ${existingAdmin.userId} exists, skipping.`);
    } else {
      await User.create({
        userId: adminUser.userId,
        name: adminUser.name,
        phone: adminUser.phone,
        passwordHash: adminUser.password, // plain text per current setup
        role: adminUser.role,
      });
      console.log(`Created admin ${adminUser.userId}`);
    }

    // Build Sanchalak users (one per mandal) with unique phones and sequential userIds per mandal code
    const seqCache = {};
    for (const [idx, m] of mandals.entries()) {
      const userId = await getNextUserIdForCode(m.code, seqCache);
      const phone = String(BASE_PHONE + idx + 1);

      const existing = await User.findOne({ $or: [{ phone }, { userId }] });
      if (existing) {
        console.log(`User ${existing.userId} exists for mandal ${m.code}, skipping.`);
        continue;
      }

      await User.create({
        userId,
        name: `Sanchalak ${m.name}`,
        phone,
        passwordHash: 'Pass@123', // plain text per current setup
        role: 'SANCHALAK',
        mandalId: m._id,
        xetra: m.xetra || null,
      });

      console.log(`Created Sanchalak ${userId} for mandal ${m.code}`);
    }

    console.log('Skipping team and ahevaal seeding (Sanchalaks only).');
    console.log('Seeding finished');
    process.exit(0);
  } catch (err) {
    console.error('Error while seeding:', err);
    process.exit(1);
  }
})();
