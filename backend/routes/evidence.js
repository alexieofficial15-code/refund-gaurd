import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Case from '../models/Case.js';
import Evidence from '../models/Evidence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure evidence upload directory exists inside backend
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'evidence');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${sanitized}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// ==========================================
// 1. UPLOAD EVIDENCE FILE TO CASE DOSSIER
// ==========================================
router.post('/cases/:caseNumber/evidence', upload.single('file'), async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { category, notes } = req.body;
    const formattedNumber = caseNumber.trim().toUpperCase();

    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });
    if (!caseDoc) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ success: false, message: 'Target case not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No evidence file uploaded.' });
    }

    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

    const evidenceRecord = await Evidence.create({
      caseId: caseDoc._id,
      caseNumber: formattedNumber,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: relativePath,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'general',
      notes: notes || null
    });

    return res.status(201).json({
      success: true,
      message: 'Evidence document cataloged into MongoDB Atlas vault.',
      evidence: evidenceRecord
    });
  } catch (err) {
    console.error('Evidence upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process evidence file.' });
  }
});

// ==========================================
// 2. LIST ALL EVIDENCE FOR A CASE
// ==========================================
router.get('/cases/:caseNumber/evidence', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const formattedNumber = caseNumber.trim().toUpperCase();

    const evidence = await Evidence.find({ caseNumber: formattedNumber }).sort({ uploadedAt: -1 });

    return res.json({
      success: true,
      count: evidence.length,
      evidence
    });
  } catch (err) {
    console.error('List evidence error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve evidence records.' });
  }
});

// ==========================================
// 3. DOWNLOAD EVIDENCE FILE
// ==========================================
router.get('/:evidenceId/download', async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const record = await Evidence.findById(evidenceId);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Evidence record not found.' });
    }

    const fullPath = path.join(__dirname, '..', record.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({
        success: false,
        message: 'Evidence file does not exist on storage disk.'
      });
    }

    return res.download(fullPath, record.originalName || record.fileName);
  } catch (err) {
    console.error('Download evidence error:', err);
    return res.status(500).json({ success: false, message: 'Failed to download file.' });
  }
});

// ==========================================
// 4. DELETE EVIDENCE FILE
// ==========================================
router.delete('/:evidenceId', async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const record = await Evidence.findById(evidenceId);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Evidence record not found.' });
    }

    const fullPath = path.join(__dirname, '..', record.filePath);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (e) {}
    }

    await Evidence.findByIdAndDelete(evidenceId);

    return res.json({
      success: true,
      message: 'Evidence document removed from vault.'
    });
  } catch (err) {
    console.error('Delete evidence error:', err);
    return res.status(500).json({ success: false, message: 'Error deleting evidence record.' });
  }
});

export default router;
