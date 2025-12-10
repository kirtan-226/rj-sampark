const User = require('../models/User');

// Basic auth using userId and password on every request. No JWT/cookies.
const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.toLowerCase().startsWith('basic '))
    return res.status(401).json({ message: 'No credentials provided' });

  const base64 = authHeader.split(' ')[1];
  let userId = '';
  let password = '';
  try {
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    [userId, password] = decoded.split(':');
  } catch (_) {
    return res.status(401).json({ message: 'Invalid auth header' });
  }

  if (!userId || !password) return res.status(401).json({ message: 'Invalid credentials' });

  try {
    const user = await User.findOne({ userId });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isActive === false) return res.status(401).json({ message: 'Account disabled' });

    if (password !== user.passwordHash) return res.status(401).json({ message: 'Invalid credentials' });

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
    return res.status(500).json({ message: 'Server error' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });
  next();
};

module.exports = { auth, requireRole };
