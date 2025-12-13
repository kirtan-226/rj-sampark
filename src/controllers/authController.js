const User = require('../models/User');
const Team = require('../models/Team');

const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (password !== user.passwordHash) return res.status(400).json({ message: 'Invalid credentials' });

    const allowedRoles = ['ADMIN', 'SANCHALAK', 'TEAM_LEADER'];
    let leaderTeam = null;
    if (!allowedRoles.includes(user.role)) {
      leaderTeam = await Team.findOne({ leader: user._id }).select('_id name teamCode mandalId').lean();
      if (!leaderTeam) {
        return res
          .status(403)
          .json({ message: 'Only Admin, Sanchalak or Team Leader accounts can login' });
      }
    }

    let teamName = null;
    let teamCode = null;
    let teamId = user.teamId;

    if (!teamId) {
      const linkedTeam = await Team.findOne({
        $or: [{ leader: user._id }, { members: user._id }, { teamLoginUser: user._id }],
      })
        .select('_id name teamCode mandalId')
        .lean();
      if (linkedTeam) {
        teamId = linkedTeam._id;
        if (!user.mandalId && linkedTeam.mandalId) user.mandalId = linkedTeam.mandalId;
        await User.updateOne({ _id: user._id }, { teamId: linkedTeam._id, mandalId: user.mandalId });
        teamName = linkedTeam.name;
        teamCode = linkedTeam.teamCode;
      } else if (leaderTeam) {
        teamId = leaderTeam._id;
        teamName = leaderTeam.name;
        teamCode = leaderTeam.teamCode;
      }
    } else {
      const team = await Team.findById(teamId).select('name teamCode').lean();
      if (team) {
        teamName = team.name;
        teamCode = team.teamCode;
      }
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        userId: user.userId,
        phone: user.phone,
        role: user.role,
        mandalId: user.mandalId,
        teamId,
        teamName,
        teamCode,
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
