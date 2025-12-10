const router = require('express').Router();
const { auth, requireRole } = require('../middleware/auth');
const { exportCSV, exportPDF } = require('../controllers/exportController');

// Admin/Sanchalak/Nirdeshak/Nirikshak can export (scoped by middleware)
router.get('/ahevaals/csv', auth, requireRole('ADMIN', 'SANCHALAK', 'NIRDESHAK', 'NIRIKSHAK'), exportCSV);
router.get('/ahevaals/pdf', auth, requireRole('ADMIN', 'SANCHALAK', 'NIRDESHAK', 'NIRIKSHAK'), exportPDF);

module.exports = router;
