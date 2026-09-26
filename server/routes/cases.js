import express from 'express';
import { 
  createCase, 
  getCasesByUserId, 
  getAllCases, 
  getCaseByNumber, 
  updateCaseStatus,
  findUserByEmail,
  saveCaseAffidavit
} from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC RADAR TRACKING (No auth required)
// ==========================================
router.get('/track/:caseNumber', (req, res) => {
  try {
    const { caseNumber } = req.params;
    if (!caseNumber) {
      return res.status(400).json({ success: false, message: 'Case reference number is required.' });
    }

    const caseDossier = getCaseByNumber(caseNumber.trim());
    if (!caseDossier) {
      return res.status(404).json({ 
        success: false, 
        message: `Case record ${caseNumber} not found in RefundGuard database.` 
      });
    }

    // Mask claimant identity for public radar tracking privacy
    const maskedClaimant = caseDossier.claimantName 
      ? caseDossier.claimantName.split(' ').map(part => part[0] + '***').join(' ') 
      : 'Confidential Claimant';

    return res.json({
      success: true,
      case: {
        id: caseDossier.id,
        caseNumber: caseDossier.caseNumber,
        status: caseDossier.status,
        scamType: caseDossier.scamType,
        title: caseDossier.title,
        description: caseDossier.description,
        incidentDate: caseDossier.incidentDate,
        disputedAmount: caseDossier.disputedAmount,
        currency: caseDossier.currency,
        paymentMethod: caseDossier.paymentMethod,
        disputeChannel: caseDossier.disputeChannel,
        createdAt: caseDossier.createdAt,
        updatedAt: caseDossier.updatedAt,
        milestones: caseDossier.milestones || [],
        evidenceCount: caseDossier.evidence ? caseDossier.evidence.length : 0,
        claimantMasked: maskedClaimant
      }
    });
  } catch (err) {
    console.error('Case tracking error:', err);
    return res.status(500).json({ success: false, message: 'Error querying case tracking radar.' });
  }
});

// ==========================================
// 2. LIST CASES (Authenticated)
// ==========================================
router.get('/', authMiddleware, (req, res) => {
  try {
    const user = req.user;
    let cases = [];

    if (user.role === 'investigator' || user.role === 'admin') {
      cases = getAllCases();
    } else {
      cases = getCasesByUserId(user.id);
    }

    return res.json({
      success: true,
      count: cases.length,
      cases
    });
  } catch (err) {
    console.error('List cases error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving dispute cases.' });
  }
});

// ==========================================
// 3. GET SINGLE CASE DOSSIER (Authenticated)
// ==========================================
router.get('/:caseNumber', authMiddleware, (req, res) => {
  try {
    const { caseNumber } = req.params;
    const caseDossier = getCaseByNumber(caseNumber);

    if (!caseDossier) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Access control: only owner or investigator/admin can inspect full dossier
    if (req.user.role !== 'investigator' && req.user.role !== 'admin' && caseDossier.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this confidential case dossier.' });
    }

    return res.json({
      success: true,
      case: caseDossier
    });
  } catch (err) {
    console.error('Get case error:', err);
    return res.status(500).json({ success: false, message: 'Error loading case details.' });
  }
});

// ==========================================
// 4. CREATE NEW CASE (Authenticated or Intake)
// ==========================================
router.post('/', async (req, res) => {
  try {
    const {
      title,
      scamType,
      disputedAmount,
      currency,
      incidentDate,
      paymentMethod,
      counterpartyInfo,
      description,
      claimantEmail,
      userId
    } = req.body;

    if (!title || !disputedAmount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Case title and disputed amount are required.' 
      });
    }

    // Determine owner userId
    let assignedUserId = userId;

    // If authenticated via header token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Decode if present
      try {
        const token = authHeader.split(' ')[1];
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'refundguard_super_secure_jwt_secret_key_2026');
        assignedUserId = decoded.id;
      } catch (e) {
        // Continue with claimantEmail resolution
      }
    }

    // If still not resolved, lookup by claimant email or fallback to demo claimant
    if (!assignedUserId && claimantEmail) {
      const user = findUserByEmail(claimantEmail);
      if (user) assignedUserId = user.id;
    }

    if (!assignedUserId) {
      // Default to the demo claimant if guest submission
      const demoClaimant = findUserByEmail('david.vance@example.com');
      assignedUserId = demoClaimant ? demoClaimant.id : 'usr_claimant_101';
    }

    const created = createCase({
      userId: assignedUserId,
      scamType: scamType || 'Online Shopping Scam',
      title: title.trim(),
      description: description ? description.trim() : '',
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      disputedAmount: parseFloat(disputedAmount) || 0,
      currency: currency || 'USD',
      paymentMethod: paymentMethod || 'Bank Wire / Transfer',
      counterpartyInfo: counterpartyInfo || null
    });

    return res.status(201).json({
      success: true,
      message: `Dispute dossier ${created.caseNumber} registered successfully.`,
      case: created
    });
  } catch (err) {
    console.error('Create case error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create case dossier in database.' });
  }
});

// ==========================================
// 5. UPDATE CASE STATUS & DISPUTE CHANNEL
// ==========================================
router.patch('/:caseNumber/status', authMiddleware, (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { status, disputeChannel } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Updated status is required.' });
    }

    const existing = getCaseByNumber(caseNumber);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Role check: Only investigators/admin can change status freely
    if (req.user.role !== 'investigator' && req.user.role !== 'admin') {
      if (status !== 'withdrawn') {
        return res.status(403).json({ 
          success: false, 
          message: 'Only assigned investigators can update case status.' 
        });
      }
    }

    const updated = updateCaseStatus(caseNumber, status, disputeChannel);

    return res.json({
      success: true,
      message: `Case ${caseNumber} status updated to ${status}.`,
      case: updated
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update case status.' });
  }
});

// ==========================================
// 6. SAVE SWORN AFFIDAVIT
// ==========================================
router.post('/:caseNumber/affidavit', (req, res) => {
  try {
    const { caseNumber } = req.params;
    const affidavitData = req.body;

    const existing = getCaseByNumber(caseNumber);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case not found in database.' });
    }

    const updated = saveCaseAffidavit(caseNumber, affidavitData);
    return res.json({
      success: true,
      message: 'Sworn affidavit successfully recorded and cryptographically sealed.',
      case: updated
    });
  } catch (err) {
    console.error('Save affidavit route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record sworn affidavit.' });
  }
});

export default router;
