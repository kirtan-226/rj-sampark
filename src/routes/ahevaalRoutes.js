const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const {
  createAhevaal,
  listMyAhevaals,
  listByMandal,
} = require('../controllers/ahevaalController');

// submit ahevaal (any logged-in user)
router.post('/', auth, createAhevaal);

// my submitted ahevaals
router.get('/my', auth, listMyAhevaals);

// mandal-wise history
router.get('/mandal', auth, requireRole('ADMIN', 'SANCHALAK', 'NIRDESHAK', 'NIRIKSHAK'), listByMandal);
router.get('/mandal/:mandalId', auth, requireRole('ADMIN', 'SANCHALAK', 'NIRDESHAK', 'NIRIKSHAK'), listByMandal);

module.exports = router;
