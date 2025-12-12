const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { createUser, listUsers, updateUser, deleteUser, getMe } = require('../controllers/userController');

// create new account (ADMIN or SANCHALAK)
router.post('/', auth, requireRole('ADMIN', 'SANCHALAK'), createUser);

// list users (mandal/team scoped)
router.get('/', auth, requireRole('ADMIN', 'SANCHALAK', 'NIRDESHAK', 'NIRIKSHAK'), listUsers);

// update/delete user (ADMIN or SANCHALAK within scope)
router.patch('/:id', auth, requireRole('ADMIN', 'SANCHALAK'), updateUser);
router.delete('/:id', auth, requireRole('ADMIN', 'SANCHALAK'), deleteUser);

// get own profile
router.get('/me', auth, getMe);

module.exports = router;
