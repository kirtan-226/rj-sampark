const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  createTeam,
  listTeams,
  listTeamsByMandal,
  updateTeam,
  deleteTeam,
} = require('../controllers/teamController');

// only ADMIN/SANCHALAK can manage teams
router.post('/', auth, requireRole('ADMIN', 'SANCHALAK'), createTeam);
router.get('/', auth, requireRole('ADMIN', 'SANCHALAK', 'NIRDESHAK', 'NIRIKSHAK'), listTeams);
router.get('/mandal/:mandalId', auth, requireRole('ADMIN', 'SANCHALAK', 'NIRDESHAK', 'NIRIKSHAK'), listTeamsByMandal);
router.patch('/:id', auth, requireRole('ADMIN', 'SANCHALAK'), updateTeam);
router.delete('/:id', auth, requireRole('ADMIN', 'SANCHALAK'), deleteTeam);

module.exports = router;
