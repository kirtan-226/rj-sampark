// seedUsers.js (Sanchalak-only seeding)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Mandal = require('./src/models/Mandal');

const xetraById = { 1: 'Bharuch-1', 2: 'Bharuch-2', 3: 'Bharuch-3' };

// Mandal + supervisor master from provided sheet
const mandalSeedData = [
  {
    name: 'Shreeji Pravesh',
    code: 'SP',
    xetra: xetraById[3],
    sanchalak: { name: 'Miten Patel', phone: '7046818385' },
    nirikshak: { name: 'Yogendra Chauhan', phone: '7433088988' },
  },
  {
    name: 'Shriniketan',
    code: 'SK',
    xetra: xetraById[1],
    sanchalak: { name: 'Rahul Patel', phone: '9265908551' },
    nirikshak: { name: 'Yogendra Chauhan', phone: '7433088988' },
  },
  {
    name: 'Manasnagar',
    code: 'MN',
    xetra: xetraById[1],
    sanchalak: { name: 'Bhavesh Limbachiya', phone: '9909948604' },
    nirikshak: { name: 'Vishal Patel', phone: '9998991253' },
  },
  {
    name: 'Shreeji Sadan',
    code: 'SS',
    xetra: xetraById[3],
    sanchalak: { name: 'Pranav Patel', phone: '9104724442' },
    nirikshak: { name: 'Vishal Patel', phone: '9998991253' },
  },
  {
    name: 'Sahjanand',
    code: 'SJ',
    xetra: xetraById[1],
    sanchalak: { name: 'Arpan Bhatt', phone: '9429187209' },
    nirikshak: { name: 'Dhaval Bhatt', phone: '8128991380' },
  },
  {
    name: 'Narayankunj',
    code: 'NK',
    xetra: xetraById[1],
    sanchalak: { name: 'Mrugesh Patel', phone: '9033980178' },
    nirikshak: { name: 'Dhaval Bhatt', phone: '8128991380' },
  },
  {
    name: 'Maitrinagar',
    code: 'MT',
    xetra: xetraById[1],
    sanchalak: { name: 'Neel Patel', phone: '9408122729' },
    nirikshak: { name: 'Pallav Parekh', phone: '8511112160' },
  },
  {
    name: 'Surbhi',
    code: 'SB',
    xetra: xetraById[1],
    sanchalak: { name: 'Aksh Patel', phone: '9313450821' },
    nirikshak: { name: 'Pallav Parekh', phone: '8511112160' },
  },
  {
    name: 'Radhakrushna',
    code: 'RK',
    xetra: xetraById[1],
    sanchalak: { name: 'Bhargav Patel', phone: '9714814711' },
    nirikshak: { name: 'Yagnesh Patel', phone: '9033576607' },
  },
  {
    name: 'Zadeshwar',
    code: 'ZD',
    xetra: xetraById[1],
    sanchalak: { name: 'Jaimin Patel', phone: '8866866202' },
    nirikshak: { name: 'Kaushik Patel', phone: '9662015390' },
  },
  {
    name: 'Ashray',
    code: 'AS',
    xetra: xetraById[2],
    sanchalak: { name: 'Viral Rana', phone: '9313861579' },
    nirikshak: { name: 'Alpesh Prajapati', phone: '9601260522' },
  },
  {
    name: 'Ganesh Township',
    code: 'GT',
    xetra: xetraById[2],
    sanchalak: { name: 'Sanket Patel', phone: '9924659633' },
    nirikshak: { name: 'Krupal Patel', phone: '9558801490' },
  },
  {
    name: 'Krushnanagar',
    code: 'KN',
    xetra: xetraById[2],
    sanchalak: { name: 'Bhargav Gohil', phone: '9173515711' },
    nirikshak: { name: 'Vikas Sarvaiya', phone: '7359351767' },
  },
  {
    name: 'Shaktinath',
    code: 'SN',
    xetra: xetraById[2],
    sanchalak: { name: 'Mihir Patel', phone: '7285024239' },
    nirikshak: { name: 'Amitkumar Limbachiya', phone: '8141180456' },
  },
  {
    name: 'Chakla',
    code: 'CH',
    xetra: xetraById[2],
    sanchalak: { name: 'Parth Patel', phone: '7043845190' },
    nirikshak: { name: 'Bhargav Parekh', phone: '7698222802' },
  },
  {
    name: 'Alipura',
    code: 'AL',
    xetra: xetraById[2],
    sanchalak: { name: 'Amit Patel', phone: '8347553945' },
    nirikshak: { name: 'Arpit Shukla', phone: '7043133205' },
  },
  {
    name: 'Zadeshwar (Mandir)',
    code: 'ZM',
    xetra: xetraById[1],
    sanchalak: { name: 'Daxesh Bhatt', phone: '9998424817' },
    nirikshak: { name: 'Parashbai Patel', phone: '9898291544' },
  },
];

// Determine the next userId for a mandal code (cached per code)
const getNextUserIdForCode = async (code, cache) => {
  if (!code) return null;
  if (!cache[code]) cache[code] = 0;

  if (!cache[code]) {
    const usersWithCode = await User.find({ userId: { $regex: `^${code}\\d+$`, $options: 'i' } }).select('userId');
    let maxSeq = 0;
    usersWithCode.forEach((u) => {
      const digits = u.userId.replace(/^[A-Za-z]+/, '');
      const n = parseInt(digits, 10);
      if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n);
    });
    cache[code] = maxSeq;
  }

  cache[code] += 1;
  const seq = cache[code] < 100 ? 100 : cache[code];
  return `${code}${String(seq).padStart(3, '0')}`;
};

// Generate userId for Nirikshak in format <MANDAL_CODE>NR<NNN>, starting at 100
const getNirikshakUserId = async (baseCode) => {
  if (!baseCode) return null;
  const prefix = `${baseCode}NR`;
  const users = await User.find({ userId: { $regex: `^${prefix}(\\d+)$`, $options: 'i' } }).select('userId');

  let maxSeq = 99;
  users.forEach((u) => {
    const match = (u.userId || '').match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
    if (match) {
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n)) maxSeq = Math.max(maxSeq, n);
    }
  });

  const nextSeq = Math.max(100, maxSeq + 1);
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
};

const passwordFromPhone = (phone, fallback = 'Pass@123') => {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return fallback;
  return digits.slice(-6);
};

const mergeObjectIds = (existing = [], incoming = []) => {
  const set = new Set();
  [...existing, ...incoming].forEach((id) => {
    if (!id) return;
    const val = id.toString();
    set.add(val);
  });
  return Array.from(set).map((id) => new mongoose.Types.ObjectId(id));
};

(async function seed() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI not set');

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Seeding mandals, sanchalaks and nirikshaks...');

    // Upsert mandals and keep existing mandal_id if present to avoid unique conflicts
    const highestMandalIdDoc = await Mandal.findOne({}, { mandal_id: 1 }).sort({ mandal_id: -1 }).lean();
    let nextMandalId = highestMandalIdDoc?.mandal_id ? highestMandalIdDoc.mandal_id + 1 : 1;
    const mandalMap = {};

    for (const entry of mandalSeedData) {
      const existing = await Mandal.findOne({ code: entry.code }).lean();
      const mandal_id = existing?.mandal_id || nextMandalId++;
      const mandal = await Mandal.findOneAndUpdate(
        { code: entry.code },
        {
          name: entry.name,
          code: entry.code,
          xetra: entry.xetra || xetraById[1],
          mandal_id,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      mandalMap[entry.code] = mandal._id;
      console.log(`${existing ? 'Updated' : 'Created'} mandal ${entry.code} (${mandal.name})`);
    }

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

    // Build Sanchalak users (one per mandal)
    const seqCache = {};
    for (const entry of mandalSeedData) {
      const details = entry.sanchalak;
      if (!details?.name || !details?.phone) continue;

      const existing = await User.findOne({ phone: details.phone });
      if (existing) {
        existing.name = details.name;
        existing.role = 'SANCHALAK';
        existing.mandalId = mandalMap[entry.code];
        existing.xetra = entry.xetra || null;
        existing.assignedMandals = [];
        existing.passwordHash = passwordFromPhone(details.phone);
        await existing.save();
        console.log(`Updated Sanchalak ${existing.userId} for mandal ${entry.code}`);
        continue;
      }

      const userId = await getNextUserIdForCode(entry.code, seqCache);
      await User.create({
        userId,
        name: details.name,
        phone: details.phone,
        passwordHash: passwordFromPhone(details.phone),
        role: 'SANCHALAK',
        mandalId: mandalMap[entry.code],
        xetra: entry.xetra || null,
        assignedMandals: [],
      });
      console.log(`Created Sanchalak ${userId} for mandal ${entry.code}`);
    }

    // Aggregate nirikshaks; merge if same phone appears for multiple mandals
    const nirikshakMap = {};
    for (const entry of mandalSeedData) {
      if (!entry.nirikshak) continue;
      const { name, phone } = entry.nirikshak;
      const key = phone || name;
      if (!key) continue;

      if (!nirikshakMap[key]) {
        nirikshakMap[key] = { name: name || 'Nirikshak', phone: phone || '', mandalCodes: new Set() };
      }
      if (!nirikshakMap[key].name && name) nirikshakMap[key].name = name;
      if (!nirikshakMap[key].phone && phone) nirikshakMap[key].phone = phone;
      nirikshakMap[key].mandalCodes.add(entry.code);
    }

    for (const agg of Object.values(nirikshakMap)) {
      const mandalIds = Array.from(agg.mandalCodes)
        .map((code) => mandalMap[code])
        .filter(Boolean);
      if (!mandalIds.length) continue;

      const primaryCode = Array.from(agg.mandalCodes)[0];
      const preferredUserId = await getNirikshakUserId(primaryCode);
      const existing = agg.phone ? await User.findOne({ phone: agg.phone }) : null;
      const mergedMandals = mergeObjectIds(existing?.assignedMandals || [], mandalIds);

      if (existing) {
        existing.name = agg.name;
        existing.role = 'NIRIKSHAK';
        existing.mandalId = null;
        existing.assignedMandals = mergedMandals;
        existing.passwordHash = passwordFromPhone(agg.phone);
        await existing.save();
        console.log(`Updated Nirikshak ${existing.userId} (${agg.name}) for codes ${Array.from(agg.mandalCodes).join(', ')}`);
      } else {
        const userId = preferredUserId || (await getNextUserIdForCode(primaryCode, seqCache));
        await User.create({
          userId,
          name: agg.name,
          phone: agg.phone,
          passwordHash: passwordFromPhone(agg.phone),
          role: 'NIRIKSHAK',
          mandalId: null,
          assignedMandals: mergedMandals,
        });
        console.log(`Created Nirikshak ${userId} (${agg.name}) for codes ${Array.from(agg.mandalCodes).join(', ')}`);
      }
    }

    console.log('Seeding finished');
    process.exit(0);
  } catch (err) {
    console.error('Error while seeding:', err);
    process.exit(1);
  }
})();
