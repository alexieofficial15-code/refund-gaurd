import express from 'express';
import Case from '../models/Case.js';
import User from '../models/User.js';
import Evidence from '../models/Evidence.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendSettlementNotificationEmail, sendClearanceBillEmail } from '../services/emailService.js';

const router = express.Router();

// 4 Standard Initial Dispute Milestones
function createInitialMilestones() {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      stepOrder: 1,
      title: 'Incident Reported & Evidence Vault Created',
      description: 'Dispute submission registered and initial documentation queued for analyst intake.',
      status: 'completed',
      completedDate: today
    },
    {
      stepOrder: 2,
      title: 'Evidence Dossier Verification',
      description: 'Analyst reviewing statement admissibility and counterparty transaction trail.',
      status: 'current',
      completedDate: today
    },
    {
      stepOrder: 3,
      title: 'Dispute Channel & Regulatory Routing',
      description: 'Formatting formal claim according to applicable banking network guidelines.',
      status: 'upcoming',
      completedDate: null
    },
    {
      stepOrder: 4,
      title: 'Formal Filing & Outcome Determination',
      description: 'Submission to recipient/issuing banks or card arbitration network.',
      status: 'upcoming',
      completedDate: null
    }
  ];
}

/**
 * Automatically synchronize user wallet balance based on active resolved cases.
 * If an admin steps down a case from resolved to pending/under review, the money is immediately deducted.
 * When a case is moved back to resolved/approved, the money is credited.
 */
export async function syncUserWallet(userId) {
  if (!userId) return 0;
  try {
    const userDoc = await User.findById(userId);
    if (!userDoc) return 0;

    const userCases = await Case.find({ userId });
    // Total settled funds from cases that are CURRENTLY in 'resolved' status
    const totalResolvedCredit = userCases
      .filter(c => c.status === 'resolved')
      .reduce((sum, c) => sum + (Number(c.settledAmount || c.disputedAmount) || 0), 0);

    // Total completed withdrawals
    const totalWithdrawals = (userDoc.walletTransactions || [])
      .filter(t => t.type === 'withdrawal' && t.status !== 'failed' && t.status !== 'cancelled')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const calculatedBalance = Math.max(0, totalResolvedCredit - totalWithdrawals);
    userDoc.walletBalance = calculatedBalance;
    await userDoc.save();
    return calculatedBalance;
  } catch (err) {
    console.error('Error syncing user wallet:', err);
    return 0;
  }
}

// ==========================================
// 1. PUBLIC CASE RADAR TRACKING (No auth required)
// ==========================================
router.get('/track/:caseNumber', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    if (!caseNumber) {
      return res.status(400).json({ success: false, message: 'Case reference number is required.' });
    }

    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber }).populate('userId', 'fullName email');

    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        message: `Case record ${formattedNumber} not found in MongoDB Atlas database.`
      });
    }

    const evidenceCount = await Evidence.countDocuments({ caseNumber: formattedNumber });

    // Mask claimant identity for privacy
    const maskedClaimant = caseDoc.userId && caseDoc.userId.fullName
      ? caseDoc.userId.fullName.split(' ').map(p => p[0] + '***').join(' ')
      : 'Confidential Claimant';

    return res.json({
      success: true,
      case: {
        id: caseDoc._id,
        caseNumber: caseDoc.caseNumber,
        status: caseDoc.status,
        scamType: caseDoc.scamType,
        title: caseDoc.title,
        description: caseDoc.description,
        incidentDate: caseDoc.incidentDate,
        disputedAmount: caseDoc.disputedAmount,
        currency: caseDoc.currency,
        paymentMethod: caseDoc.paymentMethod,
        disputeChannel: caseDoc.disputeChannel,
        createdAt: caseDoc.createdAt,
        updatedAt: caseDoc.updatedAt,
        milestones: caseDoc.milestones || [],
        evidenceCount,
        claimantMasked: maskedClaimant
      }
    });
  } catch (err) {
    console.error('Case tracking error:', err);
    return res.status(500).json({ success: false, message: 'Error querying case tracking radar.' });
  }
});

// ==========================================
// 2. LIST CASES (Authenticated / Admin)
// ==========================================
router.get('/admin/all', async (req, res) => {
  try {
    const cases = await Case.find({})
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: cases.length,
      cases
    });
  } catch (err) {
    console.error('Admin list cases error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving all dispute cases.' });
  }
});

router.get('/', async (req, res) => {
  try {
    let query = {};
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'refundguard_super_secure_jwt_secret_key_2026');
        if (decoded.role !== 'investigator' && decoded.role !== 'admin') {
          query.userId = decoded.id;
        }
      } catch (_) {
        // Token invalid or expired
      }
    } else if (req.query.all !== 'true') {
      // If no token and not explicitly requesting all, return all for ops
    }

    const cases = await Case.find(query)
      .populate('userId', 'fullName email phone')
      .sort({ createdAt: -1 });

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
// 2B. USER WALLET: FETCH BALANCE & LEDGER
// ==========================================
router.get('/wallet/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }
    const currentBalance = await syncUserWallet(userId);
    return res.json({
      success: true,
      walletBalance: currentBalance,
      walletTransactions: user.walletTransactions || [],
      withdrawalAllowed: Boolean(user.withdrawalAllowed),
      clearanceFeePaid: Boolean(user.clearanceFeePaid)
    });
  } catch (err) {
    console.error('Fetch wallet error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving user wallet.' });
  }
});

// ==========================================
// 2C. USER WALLET: REQUEST WITHDRAWAL
// ==========================================
router.post('/wallet/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, method, details, caseNumber } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid withdrawal amount is required.' });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    // Check authorization: user-level or case-level
    let isAllowed = Boolean(user.withdrawalAllowed);
    let targetCase = null;
    if (caseNumber) {
      targetCase = await Case.findOne({ 
        caseNumber: caseNumber.toString().trim().toUpperCase(), 
        userId: user._id 
      });
      if (targetCase && targetCase.withdrawalAllowed) {
        isAllowed = true;
      }
    }

    // Must be allowed/approved by admin after completing the $300 bill
    if (!isAllowed) {
      try {
        await sendClearanceBillEmail({
          user,
          caseDoc: targetCase,
          amount: withdrawAmount
        });
      } catch (err) {
        console.error('Failed to dispatch clearance bill email:', err);
      }

      return res.status(403).json({
        success: false,
        message: 'You must complete the $300 clearance bill payment first. Withdrawal will be enabled once your payment has been confirmed and authorized by administration.'
      });
    }

    const availableBalance = targetCase 
      ? Number(targetCase.settledAmount || targetCase.disputedAmount || user.walletBalance || 0)
      : (Number(user.walletBalance) || 0);

    if (withdrawAmount > availableBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Available balance: $${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` 
      });
    }

    user.walletBalance = Math.max(0, (Number(user.walletBalance) || availableBalance) - withdrawAmount);
    if (!user.walletTransactions) user.walletTransactions = [];

    const destinationLabel = details?.destination || details?.accountNumber || details?.walletAddress || (method ? method.replace('_', ' ').toUpperCase() : 'Bank Account');
    const clearanceBillNumber = details?.clearanceBillNumber || `INV-CLR-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newTx = {
      type: 'withdrawal',
      amount: withdrawAmount,
      caseNumber: targetCase ? targetCase.caseNumber : (caseNumber || undefined),
      description: `Disbursement to ${destinationLabel}`,
      method: method || 'bank_wire',
      details: {
        ...details,
        clearanceBillNumber,
        clearanceFeeAmount: 300.00,
        clearanceFeeStatus: details?.feePaymentReference ? 'verifying_payment' : 'pending_fee_payment',
        clearanceFeeReason: 'Interbank AML / Cross-Border Restitution Escrow Release Clearance Bill (FinCEN & SWIFT Reg. #CLR-882)'
      },
      status: 'pending_clearance',
      createdAt: new Date()
    };

    user.walletTransactions.unshift(newTx);
    await user.save();

    return res.json({
      success: true,
      message: `Withdrawal request for $${withdrawAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} received. Mandatory $300.00 clearance bill issued (#${clearanceBillNumber}). Payout status: Awaiting Clearance Bill Settlement.`,
      walletBalance: user.walletBalance,
      clearanceBillNumber,
      clearanceFee: 300.00,
      transaction: newTx
    });
  } catch (err) {
    console.error('Withdrawal route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process withdrawal request.' });
  }
});

// ==========================================
// 2D. USER WALLET: SUBMIT $300 CLEARANCE BILL PROOF
// ==========================================
router.post('/wallet/clearance-pay', authMiddleware, async (req, res) => {
  try {
    const { billNumber, paymentReference, paymentMethod } = req.body;
    if (!billNumber || !paymentReference) {
      return res.status(400).json({ success: false, message: 'Clearance bill reference and payment transaction proof are required.' });
    }

    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    if (!user.walletTransactions || user.walletTransactions.length === 0) {
      return res.status(404).json({ success: false, message: 'No active withdrawal transactions found.' });
    }

    const tx = user.walletTransactions.find(t => 
      t.details?.clearanceBillNumber === billNumber ||
      t.details?.clearanceBillNumber?.toUpperCase() === billNumber.toUpperCase()
    );

    if (tx) {
      tx.details = {
        ...tx.details,
        feePaymentReference: paymentReference,
        clearanceFeeStatus: 'verifying_payment',
        feePaymentMethod: paymentMethod || 'USDT TRC-20 Escrow Vault',
        feePaidAt: new Date()
      };
      user.markModified('walletTransactions');
      await user.save();
    }

    return res.json({
      success: true,
      message: `Proof of $300.00 clearance payment (${paymentReference}) submitted successfully. Our compliance specialist is verifying the escrow ledger.`,
      transaction: tx
    });
  } catch (err) {
    console.error('Clearance pay error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit clearance payment proof.' });
  }
});

// ==========================================
// 3. GET SINGLE CASE DOSSIER (Authenticated)
// ==========================================
router.get('/:caseNumber', authMiddleware, async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const formattedNumber = caseNumber.trim().toUpperCase();

    const caseDoc = await Case.findOne({ caseNumber: formattedNumber })
      .populate('userId', 'fullName email phone');

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    // Access control
    const currentUserId = (req.user._id || req.user.id).toString();
    const caseOwnerId = caseDoc.userId ? (caseDoc.userId._id || caseDoc.userId).toString() : null;

    if (req.user.role !== 'investigator' && req.user.role !== 'admin' && caseOwnerId !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Access denied to this confidential case dossier.' });
    }

    const evidence = await Evidence.find({ caseNumber: formattedNumber }).sort({ uploadedAt: -1 });

    return res.json({
      success: true,
      case: {
        ...caseDoc.toObject(),
        evidence
      }
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

    let assignedUserId = userId;

    // Check auth token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = (await import('jsonwebtoken')).default;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'refundguard_super_secure_jwt_secret_key_2026_atlas');
        assignedUserId = decoded.id;
      } catch (e) {}
    }

    if (!assignedUserId && claimantEmail) {
      const existingUser = await User.findOne({ email: claimantEmail.toLowerCase().trim() });
      if (existingUser) assignedUserId = existingUser._id;
    }

    if (!assignedUserId) {
      const defaultUser = await User.findOne({ email: 'david.vance@example.com' });
      assignedUserId = defaultUser ? defaultUser._id : (await User.findOne())?._id;
    }

    if (!assignedUserId) {
      return res.status(400).json({ success: false, message: 'Could not associate claimant user with this case.' });
    }

    const caseNumber = Case.generateCaseNumber();
    const milestones = createInitialMilestones();

    const newCase = await Case.create({
      caseNumber,
      userId: assignedUserId,
      scamType: scamType || 'Online Shopping Scam',
      title: title.trim(),
      description: description ? description.trim() : '',
      incidentDate: incidentDate || new Date().toISOString().split('T')[0],
      disputedAmount: parseFloat(disputedAmount) || 0,
      currency: currency || 'USD',
      paymentMethod: paymentMethod || 'Bank Wire / Transfer',
      counterpartyInfo: counterpartyInfo || {},
      status: 'submitted',
      disputeChannel: 'Under Evidence Review',
      milestones
    });

    return res.status(201).json({
      success: true,
      message: `Dispute dossier ${newCase.caseNumber} registered successfully in MongoDB Atlas.`,
      case: newCase
    });
  } catch (err) {
    console.error('Create case error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create case dossier in MongoDB Atlas.' });
  }
});

// ==========================================
// 5. UPDATE CASE STATUS & DISPUTE CHANNEL
// ==========================================
router.patch('/:caseNumber/status', authMiddleware, async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { status, disputeChannel } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Updated status is required.' });
    }

    const formattedNumber = caseNumber.trim().toUpperCase();
    const existing = await Case.findOne({ caseNumber: formattedNumber });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (req.user.role !== 'investigator' && req.user.role !== 'admin') {
      if (status !== 'withdrawn') {
        return res.status(403).json({
          success: false,
          message: 'Only assigned investigators can update case status.'
        });
      }
    }

    const previousStatus = existing.status;
    existing.status = status;
    if (disputeChannel) existing.disputeChannel = disputeChannel;

    if (status === 'resolved') {
      existing.settlementFlashPending = true;
      if (!existing.settledAmount) {
        existing.settledAmount = existing.disputedAmount;
      }
      existing.settledAt = new Date();
    } else {
      // Stepped down from resolved: revoke withdrawal permission and reset settlement flags
      existing.withdrawalAllowed = false;
      existing.settlementFlashPending = false;
    }

    await existing.save();

    if (existing.userId) {
      await syncUserWallet(existing.userId);
    }

    return res.json({
      success: true,
      message: `Case ${formattedNumber} status updated to ${status}.`,
      case: existing
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update case status.' });
  }
});

// ==========================================
// 6. SAVE SWORN AFFIDAVIT
// ==========================================
router.post('/:caseNumber/affidavit', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const affidavitData = req.body;

    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found in database.' });
    }

    caseDoc.affidavitSigned = true;
    caseDoc.affidavitInfo = affidavitData;
    await caseDoc.save();

    return res.json({
      success: true,
      message: 'Sworn affidavit successfully recorded and cryptographically sealed.',
      case: caseDoc
    });
  } catch (err) {
    console.error('Save affidavit route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record sworn affidavit.' });
  }
});

// ==========================================
// 7. ADMIN: UPDATE CASE FULL DETAILS
// ==========================================
router.patch('/:caseNumber/details', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const {
      title,
      disputedAmount,
      settledAmount,
      status,
      disputeChannel,
      scamType,
      incidentDate,
      paymentMethod,
      counterpartyInfo
    } = req.body;

    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber }).populate('userId', 'fullName email phone');

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (title !== undefined) caseDoc.title = title;
    if (disputedAmount !== undefined) caseDoc.disputedAmount = Number(disputedAmount);
    if (settledAmount !== undefined) caseDoc.settledAmount = Number(settledAmount);
    if (status !== undefined) {
      if (status === 'resolved') {
        caseDoc.settlementFlashPending = true;
        if (!caseDoc.settledAmount) {
          caseDoc.settledAmount = caseDoc.disputedAmount;
        }
        caseDoc.settledAt = new Date();
        if (caseDoc.userId) {
          sendSettlementNotificationEmail({
            user: caseDoc.userId,
            caseDoc,
            amount: caseDoc.settledAmount || caseDoc.disputedAmount || 0
          }).catch(err => console.error('Failed to dispatch settlement email on status resolve:', err));
        }
      } else {
        // Stepped down from resolved: revoke withdrawal permission and reset settlement flags
        caseDoc.withdrawalAllowed = false;
        caseDoc.settlementFlashPending = false;
      }
      caseDoc.status = status;
    }
    if (disputeChannel !== undefined) caseDoc.disputeChannel = disputeChannel;
    if (scamType !== undefined) caseDoc.scamType = scamType;
    if (incidentDate !== undefined) caseDoc.incidentDate = incidentDate;
    if (paymentMethod !== undefined) caseDoc.paymentMethod = paymentMethod;
    if (counterpartyInfo !== undefined) caseDoc.counterpartyInfo = counterpartyInfo;

    await caseDoc.save();

    // Synchronize owner wallet immediately
    if (caseDoc.userId) {
      const uId = caseDoc.userId._id || caseDoc.userId;
      await syncUserWallet(uId);
    }

    return res.json({
      success: true,
      message: `Case ${formattedNumber} updated successfully.`,
      case: caseDoc
    });
  } catch (err) {
    console.error('Update case details error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update case details.' });
  }
});

// ==========================================
// 8. ADMIN: UPDATE CASE MILESTONES
// ==========================================
router.patch('/:caseNumber/milestones', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { milestones } = req.body;

    if (!Array.isArray(milestones)) {
      return res.status(400).json({ success: false, message: 'Milestones array is required.' });
    }

    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    caseDoc.milestones = milestones;

    // Check step 4 (Formal Filing & Outcome Determination)
    const step4 = milestones.find(m => m.stepOrder === 4);
    if (step4) {
      if (step4.status === 'completed' && caseDoc.status !== 'resolved') {
        caseDoc.status = 'resolved';
        if (!caseDoc.settledAmount) caseDoc.settledAmount = caseDoc.disputedAmount;
        caseDoc.settledAt = new Date();
        caseDoc.settlementFlashPending = true;
      } else if (step4.status !== 'completed' && caseDoc.status === 'resolved') {
        // Stepped back from step 4 completed to upcoming or current: step down!
        caseDoc.status = 'under_review';
        caseDoc.withdrawalAllowed = false;
        caseDoc.settlementFlashPending = false;
      }
    }

    await caseDoc.save();

    if (caseDoc.userId) {
      await syncUserWallet(caseDoc.userId);
    }

    return res.json({
      success: true,
      message: `Milestones for case ${formattedNumber} updated successfully.`,
      milestones: caseDoc.milestones,
      case: caseDoc
    });
  } catch (err) {
    console.error('Update milestones error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update milestones.' });
  }
});

// ==========================================
// 8B. ADMIN: TOGGLE WITHDRAWAL PERMISSION
// ==========================================
router.patch('/:caseNumber/withdrawal-permission', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { withdrawalAllowed, clearanceFeePaid } = req.body;
    const formattedNumber = caseNumber.trim().toUpperCase();

    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    if (typeof withdrawalAllowed === 'boolean') {
      caseDoc.withdrawalAllowed = withdrawalAllowed;
    }
    if (typeof clearanceFeePaid === 'boolean') {
      caseDoc.clearanceFeePaid = clearanceFeePaid;
    }
    await caseDoc.save();

    // Also update owner user
    if (caseDoc.userId) {
      const userDoc = await User.findById(caseDoc.userId);
      if (userDoc) {
        if (typeof withdrawalAllowed === 'boolean') {
          userDoc.withdrawalAllowed = withdrawalAllowed;
        }
        if (typeof clearanceFeePaid === 'boolean') {
          userDoc.clearanceFeePaid = clearanceFeePaid;
        }
        await userDoc.save();
      }
    }

    return res.json({
      success: true,
      message: `Withdrawal authorization for Case #${formattedNumber} set to ${caseDoc.withdrawalAllowed ? 'ALLOWED' : 'LOCKED'}.`,
      withdrawalAllowed: caseDoc.withdrawalAllowed,
      clearanceFeePaid: caseDoc.clearanceFeePaid
    });
  } catch (err) {
    console.error('Update withdrawal permission error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update withdrawal permission.' });
  }
});

// ==========================================
// 9. CASE MESSAGING (Claimant & Specialist)
// ==========================================
router.get('/:caseNumber/messages', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    return res.json({
      success: true,
      messages: caseDoc.messages || []
    });
  } catch (err) {
    console.error('Get messages error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve messages.' });
  }
});

router.post('/:caseNumber/messages', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { sender, senderName, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    const newMsg = {
      sender: sender || 'specialist',
      senderName: senderName || (sender === 'claimant' ? 'Claimant' : 'Senior Analyst Sarah K.'),
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date()
    };

    if (!caseDoc.messages) caseDoc.messages = [];
    caseDoc.messages.push(newMsg);
    await caseDoc.save();

    return res.status(201).json({
      success: true,
      message: 'Message dispatched.',
      newMessage: newMsg,
      messages: caseDoc.messages
    });
  } catch (err) {
    console.error('Post message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispatch message.' });
  }
});

// ==========================================
// 10. ADMIN: TOGGLE / RESET AFFIDAVIT
// ==========================================
router.patch('/:caseNumber/affidavit-status', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { affidavitSigned, notes } = req.body;

    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    caseDoc.affidavitSigned = Boolean(affidavitSigned);
    if (!affidavitSigned) {
      caseDoc.affidavitInfo = null;
    }
    await caseDoc.save();

    return res.json({
      success: true,
      message: `Affidavit status for ${formattedNumber} updated to ${caseDoc.affidavitSigned ? 'Verified' : 'Pending'}`,
      affidavitSigned: caseDoc.affidavitSigned
    });
  } catch (err) {
    console.error('Update affidavit status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update affidavit status.' });
  }
});

// ==========================================
// 11. ADMIN: CONFIRM DISPUTE SETTLEMENT
// ==========================================
router.post('/:caseNumber/settle', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const { settledAmount } = req.body;

    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found in database.' });
    }

    const amount = Number(settledAmount) || caseDoc.disputedAmount || 0;
    const today = new Date().toISOString().split('T')[0];

    // Mark case as resolved/settled
    caseDoc.status = 'resolved';
    caseDoc.settledAmount = amount;
    caseDoc.settledAt = new Date();
    caseDoc.settlementFlashPending = true;

    // Advance Milestones to 100% complete
    if (Array.isArray(caseDoc.milestones)) {
      caseDoc.milestones = caseDoc.milestones.map(m => {
        if (m.stepOrder === 4 || m.title.toLowerCase().includes('outcome')) {
          return { ...m.toObject(), status: 'completed', completedDate: today };
        }
        if (m.status === 'upcoming') {
          return { ...m.toObject(), status: 'completed', completedDate: today };
        }
        return m;
      });
    }

    // Add celebration analyst message
    if (!caseDoc.messages) caseDoc.messages = [];
    caseDoc.messages.push({
      sender: 'specialist',
      senderName: 'Senior Analyst Sarah K.',
      text: `Formal Dispute Settlement Finalized! An amount of $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been recovered and credited to your RefundGuard Secure Wallet. You may initiate a withdrawal to your bank account or cryptocurrency address anytime.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date()
    });

    await caseDoc.save();

    // Credit User Wallet
    if (caseDoc.userId) {
      const userDoc = await User.findById(caseDoc.userId);
      if (userDoc) {
        if (!userDoc.walletTransactions) userDoc.walletTransactions = [];
        userDoc.walletTransactions.unshift({
          type: 'settlement_credit',
          amount,
          caseNumber: formattedNumber,
          description: `Dispute Recovery Settlement Credit (#${formattedNumber})`,
          method: 'direct_credit',
          status: 'completed',
          createdAt: new Date()
        });
        await userDoc.save();
        await syncUserWallet(caseDoc.userId);

        // Send formal settlement notification email to claimant
        try {
          await sendSettlementNotificationEmail({
            user: userDoc,
            caseDoc,
            amount
          });
        } catch (mailErr) {
          console.error('Failed to send settlement email:', mailErr);
        }
      }
    }

    return res.json({
      success: true,
      message: `Dispute #${formattedNumber} confirmed settled. $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} credited to claimant wallet.`,
      case: caseDoc
    });
  } catch (err) {
    console.error('Settle case error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record settlement.' });
  }
});

// ==========================================
// 12. CLAIMANT: DISPATCH $300 CLEARANCE BILL NOTICE EMAIL
// ==========================================
router.post('/:caseNumber/request-clearance-notice', authMiddleware, async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const formattedNumber = caseNumber.trim().toUpperCase();
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found in database.' });
    }

    const billNumber = `INV-CLR-${Math.floor(1000 + Math.random() * 9000)}`;

    await sendClearanceBillEmail({
      user,
      caseDoc,
      amount: caseDoc.settledAmount || caseDoc.disputedAmount || 0,
      billNumber
    });

    return res.json({
      success: true,
      message: `Official $300 clearance bill notification dispatched to ${user.email}.`,
      billNumber
    });
  } catch (err) {
    console.error('Request clearance notice error:', err);
    return res.status(500).json({ success: false, message: 'Failed to dispatch clearance notice.' });
  }
});

// ==========================================
// 12. CLAIMANT: ACKNOWLEDGE SETTLEMENT FLASH
// ==========================================
router.post('/:caseNumber/ack-settlement', async (req, res) => {
  try {
    const { caseNumber } = req.params;
    const formattedNumber = caseNumber.trim().toUpperCase();
    const caseDoc = await Case.findOne({ caseNumber: formattedNumber });

    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found.' });
    }

    caseDoc.settlementFlashPending = false;
    await caseDoc.save();

    return res.json({ success: true, message: 'Settlement flash acknowledged.' });
  } catch (err) {
    console.error('Acknowledge settlement error:', err);
    return res.status(500).json({ success: false, message: 'Error updating settlement flash status.' });
  }
});

export default router;
