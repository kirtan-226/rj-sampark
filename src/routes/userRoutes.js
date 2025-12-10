const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { createUser, getMe } = require('../controllers/userController');

// create new account (ADMIN or SANCHALAK)
router.post('/', auth, requireRole('ADMIN', 'SANCHALAK'), createUser);

// get own profile
router.get('/me', auth, getMe);

module.exports = router;
