const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const Ahevaal = require('../models/Ahevaal');
const Mandal = require('../models/Mandal');

const buildFilterFromQuery = async (req) => {
  let mandalIds = [];
  if (req.user.role === 'ADMIN') {
    if (req.query.mandalId) mandalIds = [req.query.mandalId];
    else mandalIds = null; // all
  } else if (req.user.role === 'SANCHALAK') {
    mandalIds = req.user.mandalId ? [req.user.mandalId] : [];
  } else if (req.user.role === 'NIRDESHAK') {
    if (!req.currentUser.xetra) return { mandalId: null, none: true };
    const mandals = await Mandal.find({ xetra: req.currentUser.xetra }).select('_id');
    mandalIds = mandals.map((m) => m._id.toString());
  } else if (req.user.role === 'NIRIKSHAK') {
    mandalIds = (req.currentUser.assignedMandals || []).map((m) => m.toString());
  }

  if (mandalIds) {
    if (mandalIds.length === 0) return { none: true };
    // apply query override but ensure in allowed set
    if (req.query.mandalId) {
      if (!mandalIds.includes(req.query.mandalId)) return { none: true };
      mandalIds = [req.query.mandalId];
    }
  }

  const filter = {};
  if (mandalIds) filter.mandalId = { $in: mandalIds };
  if (req.query.teamId) filter.teamId = req.query.teamId;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }
  return filter;
};

const exportCSV = async (req, res) => {
  try {
    const filter = await buildFilterFromQuery(req);
    if (filter.none) return res.json([]);
    const ahevaals = await Ahevaal.find(filter).lean();

    const fields = ['name', 'phone', 'dob', 'address', 'grade', 'specialExp', 'startTime', 'endTime', 'createdAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(ahevaals);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ahevaals.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const exportPDF = async (req, res) => {
  try {
    const filter = await buildFilterFromQuery(req);
    if (filter.none) return res.end();
    const ahevaals = await Ahevaal.find(filter).lean();

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ahevaals.pdf"');

    doc.pipe(res);

    doc.fontSize(18).text('Ahevaal Report', { align: 'center' });
    doc.moveDown();

    ahevaals.forEach((a, idx) => {
      doc
        .fontSize(12)
        .text(`${idx + 1}. Name: ${a.name}`)
        .text(`   Phone: ${a.phone}`)
        .text(`   DOB: ${a.dob ? new Date(a.dob).toLocaleDateString() : '-'}`)
        .text(`   Address: ${a.address || '-'}`)
        .text(`   Grade: ${a.grade || '-'}`)
        .text(`   Special: ${a.specialExp || '-'}`)
        .text(`   Start: ${a.startTime ? new Date(a.startTime).toLocaleString() : '-'}`)
        .text(`   End: ${a.endTime ? new Date(a.endTime).toLocaleString() : '-'}`)
        .text(`   Date: ${new Date(a.createdAt).toLocaleString()}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error(err);
    // Can't send JSON after starting PDF stream, so just end
    try {
      res.end();
    } catch (_) {}
  }
};

module.exports = { exportCSV, exportPDF };
