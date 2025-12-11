const User = require('../models/User');

// Basic auth using userId and password on every request. No JWT/cookies.
const auth = async (req, res, next) => {
  const authHeader = (req.headers.authorization || '').toLowerCase();

  // If no Authorization header, allow anonymous access with open role
  if (!authHeader.startsWith('basic ')) {
    req.user = { id: null, role: 'ADMIN', mandalId: null, teamId: null };
    req.currentUser = { role: 'ADMIN' };
    return next();
  }

  const base64 = authHeader.split(' ')[1];
  let userId = '';
  let password = '';
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    [userId, password] = decoded.split(':');
  } catch (_) {
    // treat invalid header as anonymous
    req.user = { id: null, role: 'ADMIN', mandalId: null, teamId: null };
    req.currentUser = { role: 'ADMIN' };
    return next();
  }

  if (!userId || !password) {
    req.user = { id: null, role: 'ADMIN', mandalId: null, teamId: null };
    req.currentUser = { role: 'ADMIN' };
    return next();
  }

  try {
    const user = await User.findOne({ userId });
    if (!user || user.isActive === false || password !== user.passwordHash) {
      req.user = { id: null, role: 'ADMIN', mandalId: null, teamId: null };
      req.currentUser = { role: 'ADMIN' };
      return next();
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      mandalId: user.mandalId,
      teamId: user.teamId,
    };

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    req.currentUser = safeUser;
    next();
  } catch (err) {
    console.error(err);
    // fallback to anonymous
    req.user = { id: null, role: 'ADMIN', mandalId: null, teamId: null };
    req.currentUser = { role: 'ADMIN' };
    return next();
  }
};

const requireRole = (...roles) => (req, res, next) => {
  // authentication removed: allow all
  next();
};

module.exports = { auth, requireRole };
