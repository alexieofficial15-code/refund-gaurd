import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Case from '../models/Case.js';
import Evidence from '../models/Evidence.js';

let isConnected = false;
let connectionError = null;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[MongoDB Atlas] ⚠️ MONGODB_URI is not set in .env! Please set your connection string.');
    connectionError = 'MONGODB_URI not configured in .env';
    return false;
  }

  // Check for unpopulated placeholders in connection string
  if (uri.includes('<username>') || uri.includes('<password>')) {
    console.warn('[MongoDB Atlas] ⚠️ MONGODB_URI contains placeholder credentials (<username>:<password>). Please update .env with your real Atlas user and password.');
    connectionError = 'Placeholder credentials in MONGODB_URI';
    return false;
  }

  try {
    console.log('[MongoDB Atlas] Connecting to cluster...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      autoIndex: true
    });

    isConnected = true;
    connectionError = null;
    console.log(`[MongoDB Atlas] ✅ Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.warn('[MongoDB Atlas] Connection event error:', err.message);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Atlas] Disconnected from Atlas. Attempting reconnect...');
      isConnected = false;
      setTimeout(connectDB, 3000);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[MongoDB Atlas] Reconnected successfully.');
      isConnected = true;
    });

    // Run auto-seeder if database is fresh
    await seedDefaultData();
    return true;
  } catch (err) {
    isConnected = false;
    connectionError = err.message;
    console.error(`[MongoDB Atlas] ❌ Connection failed: ${err.message}`);
    console.warn('[MongoDB Atlas] Tip: Ensure your IP is whitelisted in MongoDB Atlas Network Access (0.0.0.0/0 for anywhere, or your current IP).');
    setTimeout(connectDB, 5000);
    return false;
  }
}

export function getDBStatus() {
  return {
    engine: 'MongoDB Atlas',
    isConnected,
    readyState: mongoose.connection.readyState, // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    host: mongoose.connection.host || null,
    database: mongoose.connection.name || null,
    error: connectionError
  };
}

async function seedDefaultData() {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[MongoDB Atlas] Seeding initial demo accounts...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123!', salt);

      // Seed Claimant Demo User
      const claimant = await User.create({
        fullName: 'David Vance',
        email: 'david.vance@example.com',
        phone: '+1 (555) 234-8901',
        passwordHash: hashedPassword,
        role: 'claimant',
        avatar: 'DV',
        is2FAEnabled: true,
        legalConsentAgreed: true
      });

      // Seed Investigator Demo User
      const investigator = await User.create({
        fullName: 'Elena Rostova',
        email: 'elena.rostova@refundguard.org',
        phone: '+1 (555) 890-1122',
        passwordHash: hashedPassword,
        role: 'investigator',
        avatar: 'ER',
        is2FAEnabled: true,
        legalConsentAgreed: true
      });

      console.log('[MongoDB Atlas] Seeding sample case dossier #RG-10482...');
      const sampleCase = await Case.create({
        caseNumber: 'RG-10482',
        userId: claimant._id,
        scamType: 'Bank Transfer Fraud',
        title: 'Offshore Brokerage Wire Transfer Fraud',
        description: 'Wire transfer of $4,850.00 sent to a rogue offshore trading broker who subsequently ceased communications and blocked portal access.',
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
        assignedInvestigatorId: investigator._id,
        milestones: [
          {
            stepOrder: 1,
            title: 'Evidence Dossier Compiled',
            description: 'Transaction statements, SWIFT confirmation, and broker chat logs structured into admissible format.',
            status: 'completed',
            completedDate: '2026-01-15'
          },
          {
            stepOrder: 2,
            title: 'Dispute Channel Identified',
            description: 'Appropriate Interbank Recall protocols and jurisdiction-specific regulatory procedures identified.',
            status: 'completed',
            completedDate: '2026-01-17'
          },
          {
            stepOrder: 3,
            title: 'Investigation in Progress',
            description: 'Formal claim filed with issuing institution; awaiting correspondent bank fraud unit assessment.',
            status: 'current',
            completedDate: '2026-01-20'
          },
          {
            stepOrder: 4,
            title: 'Final Determination & Settlement',
            description: 'Awaiting formal liability ruling from participating banking networks.',
            status: 'upcoming',
            completedDate: null
          }
        ]
      });

      // Seed 2 Evidence items
      await Evidence.create([
        {
          caseId: sampleCase._id,
          caseNumber: sampleCase.caseNumber,
          fileName: 'swift_mt103_receipt.pdf',
          originalName: 'Wire_Confirmation_MT103.pdf',
          filePath: 'uploads/evidence/sample_mt103.pdf',
          fileType: 'application/pdf',
          fileSize: 148200,
          category: 'statement',
          notes: 'Official bank wire receipt showing beneficiary account and SWIFT routing.'
        },
        {
          caseId: sampleCase._id,
          caseNumber: sampleCase.caseNumber,
          fileName: 'broker_chat_transcript.png',
          originalName: 'WhatsApp_Broker_Screenshots.png',
          filePath: 'uploads/evidence/sample_chat.png',
          fileType: 'image/png',
          fileSize: 382400,
          category: 'chat_log',
          notes: 'Chat screenshots documenting promised returns and refusal of withdrawal requests.'
        }
      ]);

      console.log('[MongoDB Atlas] ✅ Database initialized and seeded with demo accounts and case #RG-10482.');
    }
  } catch (err) {
    console.error('[MongoDB Atlas] Seeding error:', err);
  }
}
