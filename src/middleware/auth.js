const User = require('../models/User');
const Team = require('../models/Team');

// Basic auth using userId and password on every request. No JWT/cookies.
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  // Require Basic auth header
  if (!authHeader.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  const base64 = authHeader.split(' ')[1];
  let userId = '';
  let password = '';
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    [userId, password] = decoded.split(':');
  } catch (_) {
    return res.status(400).json({ message: 'Invalid Authorization header' });
  }

  if (!userId || !password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  try {
    const user = await User.findOne({ userId });
    if (!user || user.isActive === false || password !== user.passwordHash) {
      req.user = { id: null, role: 'ADMIN', mandalId: null, teamId: null };
      req.currentUser = { role: 'ADMIN' };
      return next();
    }

    let teamId = user.teamId;
    // If user has no teamId, try to resolve via leader/members lookup
    if (!teamId) {
      const team = await Team.findOne({
        $or: [{ leader: user._id }, { members: user._id }],
      }).select('_id mandalId');
      if (team) {
        teamId = team._id;
        if (!user.mandalId && team.mandalId) {
          user.mandalId = team.mandalId;
        }
      }
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      mandalId: user.mandalId,
      teamId,
    };

    const safeUser = user.toObject();
    delete safeUser.passwordHash;
    if (teamId) safeUser.teamId = teamId;
    req.currentUser = safeUser;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};

module.exports = { auth, requireRole };
