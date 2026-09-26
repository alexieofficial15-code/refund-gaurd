import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Case from './models/Case.js';
import Evidence from './models/Evidence.js';
import Otp from './models/Otp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas for comprehensive seeding...');
  await mongoose.connect(uri);
  console.log('Connected to Atlas successfully!');

  // Clear existing collections for a clean seed
  console.log('Clearing existing collections...');
  await User.deleteMany({});
  await Case.deleteMany({});
  await Evidence.deleteMany({});
  await Otp.deleteMany({});

  console.log('Generating password hashes...');
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

  // ==========================================
  // 1. SEED USERS (Claimants, Analysts, Admin)
  // ==========================================
  console.log('Seeding Users...');
  const users = await User.create([
    {
      fullName: 'David Vance',
      email: 'david.vance@example.com',
      phone: '+1 (555) 234-8901',
      passwordHash: defaultPasswordHash,
      role: 'claimant',
      avatar: 'DV',
      is2FAEnabled: true,
      legalConsentAgreed: true
    },
    {
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+1 (555) 412-9903',
      passwordHash: defaultPasswordHash,
      role: 'claimant',
      avatar: 'SJ',
      is2FAEnabled: true,
      legalConsentAgreed: true
    },
    {
      fullName: 'Michael Chang',
      email: 'michael.chang@example.com',
      phone: '+1 (555) 781-4452',
      passwordHash: defaultPasswordHash,
      role: 'claimant',
      avatar: 'MC',
      is2FAEnabled: true,
      legalConsentAgreed: true
    },
    {
      fullName: 'Elena Rostova',
      email: 'elena.rostova@refundguard.org',
      phone: '+1 (555) 890-1122',
      passwordHash: defaultPasswordHash,
      role: 'investigator',
      avatar: 'ER',
      is2FAEnabled: true,
      legalConsentAgreed: true
    },
    {
      fullName: 'Marcus Vance',
      email: 'marcus.vance@refundguard.org',
      phone: '+1 (555) 302-8877',
      passwordHash: defaultPasswordHash,
      role: 'investigator',
      avatar: 'MV',
      is2FAEnabled: true,
      legalConsentAgreed: true
    },
    {
      fullName: 'System Administrator',
      email: 'admin@refundguard.org',
      phone: '+1 (555) 000-1111',
      passwordHash: defaultPasswordHash,
      role: 'admin',
      avatar: 'SA',
      is2FAEnabled: true,
      legalConsentAgreed: true
    }
  ]);

  const [david, sarah, michael, elena, marcus] = users;

  // ==========================================
  // 2. SEED CASES & MILESTONES
  // ==========================================
  console.log('Seeding Comprehensive Case Dossiers...');

  // Case 1: Offshore Brokerage Wire Fraud (David Vance)
  const case1 = await Case.create({
    caseNumber: 'RG-10482',
    userId: david._id,
    scamType: 'Bank Transfer Fraud',
    title: 'Offshore Brokerage Wire Transfer Fraud',
    description: 'Wire transfer of $4,850.00 sent to rogue offshore trading broker Apex Trade Global Ltd who ceased communications and blocked client portal access.',
    incidentDate: '2026-01-14',
    disputedAmount: 4850.00,
    currency: 'USD',
    paymentMethod: 'Bank Wire Transfer',
    counterpartyInfo: {
      bankName: 'First Apex Correspondent Bank',
      beneficiary: 'Apex Trade Global Ltd',
      swift: 'APEXUS33XXX',
      wireReference: 'WT-992182'
    },
    status: 'under_review',
    disputeChannel: 'Interbank SWIFT Recall & Ombudsman Arbitration',
    assignedInvestigatorId: elena._id,
    milestones: [
      {
        stepOrder: 1,
        title: 'Incident Reported & Evidence Vault Created',
        description: 'Transaction statements, SWIFT confirmation, and broker chat logs structured into admissible format.',
        status: 'completed',
        completedDate: '2026-01-15'
      },
      {
        stepOrder: 2,
        title: 'Evidence Dossier Verification',
        description: 'Appropriate Interbank Recall protocols and jurisdiction-specific regulatory procedures identified.',
        status: 'completed',
        completedDate: '2026-01-17'
      },
      {
        stepOrder: 3,
        title: 'Dispute Channel & Regulatory Routing',
        description: 'Formal claim filed with issuing institution; awaiting correspondent bank fraud unit assessment.',
        status: 'current',
        completedDate: '2026-01-20'
      },
      {
        stepOrder: 4,
        title: 'Formal Filing & Outcome Determination',
        description: 'Awaiting formal liability ruling from participating banking networks.',
        status: 'upcoming',
        completedDate: null
      }
    ]
  });

  // Case 2: E-Commerce Luxury Escrow Fraud (Sarah Jenkins)
  const case2 = await Case.create({
    caseNumber: 'RG-20914',
    userId: sarah._id,
    scamType: 'Online Shopping Scam',
    title: 'Counterfeit Luxury Merchant Credit Card Fraud',
    description: 'Purchased certified designer merchandise on fraudulent mirror portal. Merchant billed credit card under false merchant identifier and shipped empty carton.',
    incidentDate: '2026-01-22',
    disputedAmount: 1290.00,
    currency: 'USD',
    paymentMethod: 'Credit or Debit Card',
    counterpartyInfo: {
      merchantName: 'LuxeGems Global Boutique',
      cardNetwork: 'Visa Dispute / Chargeback Code 4853',
      transactionId: 'TXN-VISA-882190'
    },
    status: 'dispute_routing',
    disputeChannel: 'Visa / Mastercard Rulebook Chargeback Dispute (Defective/Not As Described)',
    assignedInvestigatorId: elena._id,
    milestones: [
      {
        stepOrder: 1,
        title: 'Incident Reported & Evidence Vault Created',
        description: 'Card statement, tracking delivery receipt, and appraisal report cataloged.',
        status: 'completed',
        completedDate: '2026-01-23'
      },
      {
        stepOrder: 2,
        title: 'Evidence Dossier Verification',
        description: 'Visa chargeback condition code 4853 package generated.',
        status: 'completed',
        completedDate: '2026-01-25'
      },
      {
        stepOrder: 3,
        title: 'Dispute Channel & Regulatory Routing',
        description: 'Dispute packet transmitted to card issuing bank dispute desk.',
        status: 'current',
        completedDate: '2026-01-28'
      },
      {
        stepOrder: 4,
        title: 'Formal Filing & Outcome Determination',
        description: 'Awaiting acquirer response window (30-day arbitration timeline).',
        status: 'upcoming',
        completedDate: null
      }
    ]
  });

  // Case 3: Web3 Smart Contract Phishing (Michael Chang)
  const case3 = await Case.create({
    caseNumber: 'RG-34180',
    userId: michael._id,
    scamType: 'Investment / Crypto Scam',
    title: 'DeFi Liquidity Pool Signature Drain Scam',
    description: 'Malicious Permit2 approval signature drained USDT balance into decentralized mixer pool following spoofed airdrop invitation.',
    incidentDate: '2026-02-01',
    disputedAmount: 8400.00,
    currency: 'USD',
    paymentMethod: 'Cryptocurrency / Web3',
    counterpartyInfo: {
      walletAddress: '0x71C...892B (Tagged Malicious Drainer)',
      txHash: '0x9a8f...21ce89b0',
      blockchain: 'Ethereum Mainnet'
    },
    status: 'submitted',
    disputeChannel: 'Chain Forensics Dossier & Law Enforcement Cyber Intake',
    assignedInvestigatorId: marcus._id,
    milestones: [
      {
        stepOrder: 1,
        title: 'Incident Reported & Evidence Vault Created',
        description: 'On-chain transaction hash and wallet interaction logs registered.',
        status: 'completed',
        completedDate: '2026-02-01'
      },
      {
        stepOrder: 2,
        title: 'Evidence Dossier Verification',
        description: 'Forensic wallet clustering analysis in progress to trace exchange off-ramps.',
        status: 'current',
        completedDate: '2026-02-03'
      },
      {
        stepOrder: 3,
        title: 'Dispute Channel & Regulatory Routing',
        description: 'Subpoena evidentiary packet for KYC-compliant exchange deposit addresses.',
        status: 'upcoming',
        completedDate: null
      },
      {
        stepOrder: 4,
        title: 'Formal Filing & Outcome Determination',
        description: 'Law enforcement freeze request submitted to exchange compliance teams.',
        status: 'upcoming',
        completedDate: null
      }
    ]
  });

  // Case 4: Resolved P2P Market Dispute (David Vance - 2nd case)
  const case4 = await Case.create({
    caseNumber: 'RG-48902',
    userId: david._id,
    scamType: 'Other Suspicious Transaction',
    title: 'Peer-to-Peer Authorized Push Payment Fraud',
    description: 'Unauthorized peer-to-peer money transfer following account takeover scam. Full liability established with issuing financial institution.',
    incidentDate: '2025-11-10',
    disputedAmount: 650.00,
    currency: 'USD',
    paymentMethod: 'Peer-to-Peer / Digital Wallet',
    counterpartyInfo: {
      p2pPlatform: 'Zelle / Mobile P2P Network',
      recipientTag: 'ApexDirect22'
    },
    status: 'resolved',
    disputeChannel: 'Consumer Financial Protection Bureau (CFPB) & Banking Ombudsman Ruling',
    assignedInvestigatorId: elena._id,
    milestones: [
      {
        stepOrder: 1,
        title: 'Incident Reported & Evidence Vault Created',
        description: 'Statement logs and device access records submitted.',
        status: 'completed',
        completedDate: '2025-11-11'
      },
      {
        stepOrder: 2,
        title: 'Evidence Dossier Verification',
        description: 'Formal Reg E dispute packet structured and filed with bank compliance.',
        status: 'completed',
        completedDate: '2025-11-14'
      },
      {
        stepOrder: 3,
        title: 'Dispute Channel & Regulatory Routing',
        description: 'Bank fraud division validated unauthorized access indicator.',
        status: 'completed',
        completedDate: '2025-11-20'
      },
      {
        stepOrder: 4,
        title: 'Formal Filing & Outcome Determination',
        description: 'Full dispute settlement granted and funds credited back to claimant account.',
        status: 'completed',
        completedDate: '2025-12-05'
      }
    ]
  });

  // ==========================================
  // 3. SEED EVIDENCE DOCUMENTS
  // ==========================================
  console.log('Seeding Evidence Documents in Vault...');
  await Evidence.create([
    {
      caseId: case1._id,
      caseNumber: case1.caseNumber,
      fileName: 'swift_mt103_receipt.pdf',
      originalName: 'Wire_Confirmation_MT103.pdf',
      filePath: 'uploads/evidence/sample_mt103.pdf',
      fileType: 'application/pdf',
      fileSize: 148200,
      category: 'statement',
      notes: 'Official bank wire receipt showing beneficiary account and SWIFT routing.'
    },
    {
      caseId: case1._id,
      caseNumber: case1.caseNumber,
      fileName: 'broker_chat_transcript.png',
      originalName: 'WhatsApp_Broker_Screenshots.png',
      filePath: 'uploads/evidence/sample_chat.png',
      fileType: 'image/png',
      fileSize: 382400,
      category: 'chat_log',
      notes: 'Chat screenshots documenting promised returns and refusal of withdrawal requests.'
    },
    {
      caseId: case2._id,
      caseNumber: case2.caseNumber,
      fileName: 'visa_chargeback_statement.pdf',
      originalName: 'Card_Statement_January_2026.pdf',
      filePath: 'uploads/evidence/sample_mt103.pdf',
      fileType: 'application/pdf',
      fileSize: 220100,
      category: 'statement',
      notes: 'Monthly billing statement documenting disputed unauthorized charge.'
    },
    {
      caseId: case2._id,
      caseNumber: case2.caseNumber,
      fileName: 'empty_package_photos.png',
      originalName: 'Shipping_Carrier_Delivery_Photos.png',
      filePath: 'uploads/evidence/sample_chat.png',
      fileType: 'image/png',
      fileSize: 512000,
      category: 'photo_proof',
      notes: 'Carrier scale receipt showing parcel weight discrepancy upon delivery.'
    },
    {
      caseId: case3._id,
      caseNumber: case3.caseNumber,
      fileName: 'etherscan_drain_receipt.pdf',
      originalName: 'Etherscan_TxHash_0x9a8f21.pdf',
      filePath: 'uploads/evidence/sample_mt103.pdf',
      fileType: 'application/pdf',
      fileSize: 98400,
      category: 'blockchain_trace',
      notes: 'Cryptographic receipt of ERC-20 Permit2 unauthorized token drain.'
    },
    {
      caseId: case4._id,
      caseNumber: case4.caseNumber,
      fileName: 'bank_settlement_closure_letter.pdf',
      originalName: 'Final_Determination_Settlement_Letter.pdf',
      filePath: 'uploads/evidence/sample_mt103.pdf',
      fileType: 'application/pdf',
      fileSize: 312000,
      category: 'legal_ruling',
      notes: 'Formal bank restitution letter confirming credit reimbursement under Reg E.'
    }
  ]);

  // ==========================================
  // 4. SEED SAMPLE OTPS
  // ==========================================
  console.log('Seeding Sample OTPs...');
  await Otp.create([
    {
      email: 'david.vance@example.com',
      code: '123456',
      type: '2fa',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    {
      email: 'elena.rostova@refundguard.org',
      code: '123456',
      type: '2fa',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  ]);

  console.log('\n=============================================');
  console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
  console.log('Seed Summary:');
  console.log(`- Users Seeded: 6 (Claimants, Fraud Analysts, Admin)`);
  console.log(`- Cases Seeded: 4 (#RG-10482, #RG-20914, #RG-34180, #RG-48902)`);
  console.log(`- Evidence Documents: 6 Admissible Documents in Vault`);
  console.log(`- Demo Accounts:`);
  console.log(`  * David Vance (Claimant): david.vance@example.com / Password123!`);
  console.log(`  * Sarah Jenkins (Claimant): sarah.jenkins@example.com / Password123!`);
  console.log(`  * Michael Chang (Claimant): michael.chang@example.com / Password123!`);
  console.log(`  * Elena Rostova (Investigator): elena.rostova@refundguard.org / Password123!`);
  console.log(`  * Marcus Vance (Investigator): marcus.vance@refundguard.org / Password123!`);
  console.log(`  * Administrator: admin@refundguard.org / Password123!`);
  console.log('=============================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
