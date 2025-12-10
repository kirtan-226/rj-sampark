const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { createMandal, listMandals, updateMandal, deleteMandal } = require('../controllers/mandalController');

// List: Admin, Nirdeshak, Nirikshak, Sanchalak (scoped)
router.get('/', auth, requireRole('ADMIN', 'NIRDESHAK', 'NIRIKSHAK', 'SANCHALAK'), listMandals);

// Admin only create/update/delete
router.post('/', auth, requireRole('ADMIN'), createMandal);
router.patch('/:id', auth, requireRole('ADMIN'), updateMandal);
router.delete('/:id', auth, requireRole('ADMIN'), deleteMandal);

module.exports = router;
