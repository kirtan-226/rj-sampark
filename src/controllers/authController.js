const User = require('../models/User');

const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (password !== user.passwordHash) return res.status(400).json({ message: 'Invalid credentials' });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        userId: user.userId,
        phone: user.phone,
        role: user.role,
        mandalId: user.mandalId,
        teamId: user.teamId,
      },
      message: 'Login successful. Use x-user-id header (user.id) for API calls.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { userId, phone, newPassword } = req.body;
    if (!userId || !phone || !newPassword)
      return res.status(400).json({ message: 'userId, phone and newPassword are required' });

    const user = await User.findOne({ userId, phone });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.passwordHash = newPassword; // plaintext (as you want)
    user.resetCode = undefined;
    user.resetCodeExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const resetPassword = forgotPassword;

module.exports = { login, forgotPassword, resetPassword };
