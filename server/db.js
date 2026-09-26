import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'refundguard.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database connection
export const db = new DatabaseSync(DB_FILE);

// Enable WAL mode and foreign key constraints
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Database Schema
export function initDatabase() {
  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      passwordHash TEXT NOT NULL,
      role TEXT DEFAULT 'claimant',
      avatar TEXT,
      is2FAEnabled INTEGER DEFAULT 1,
      legalConsentAgreed INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // 2. Cases Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      caseNumber TEXT UNIQUE NOT NULL,
      userId TEXT NOT NULL,
      scamType TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      incidentDate TEXT,
      disputedAmount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      paymentMethod TEXT,
      counterpartyInfo TEXT,
      status TEXT DEFAULT 'submitted',
      disputeChannel TEXT,
      assignedInvestigatorId TEXT,
      affidavitSigned INTEGER DEFAULT 0,
      affidavitInfo TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(userId);
    CREATE INDEX IF NOT EXISTS idx_cases_number ON cases(caseNumber);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
  `);

  try {
    db.exec('ALTER TABLE cases ADD COLUMN affidavitInfo TEXT;');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE cases ADD COLUMN affidavitSigned INTEGER DEFAULT 0;');
  } catch (_) {}

  // 3. Case Milestones Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS case_milestones (
      id TEXT PRIMARY KEY,
      caseId TEXT NOT NULL,
      stepOrder INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      completedDate TEXT,
      FOREIGN KEY (caseId) REFERENCES cases(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_milestones_case ON case_milestones(caseId);
  `);

  // 4. Evidence Documents Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      caseId TEXT NOT NULL,
      fileName TEXT NOT NULL,
      originalName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      fileType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      category TEXT DEFAULT 'general',
      notes TEXT,
      uploadedAt TEXT NOT NULL,
      FOREIGN KEY (caseId) REFERENCES cases(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(caseId);
  `);

  // 5. OTPs Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS otps (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expiresAt INTEGER NOT NULL
    );
  `);

  // Seed default data if empty
  seedDefaultData();
}

// Seed Initial Accounts & Case Dossiers
function seedDefaultData() {
  const userCountStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const userCount = userCountStmt.get().count;

  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('Password123!', salt);

    // Insert Claimant Demo User
    const insertUser = db.prepare(`
      INSERT INTO users (id, fullName, email, phone, passwordHash, role, avatar, is2FAEnabled, legalConsentAgreed, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const claimantId = 'usr_claimant_101';
    insertUser.run(
      claimantId,
      'David Vance',
      'david.vance@example.com',
      '+1 (555) 234-8901',
      hashedPassword,
      'claimant',
      'DV',
      1,
      1,
      '2026-01-14T10:00:00.000Z'
    );

    // Insert Investigator Demo User
    const investigatorId = 'usr_inv_202';
    insertUser.run(
      investigatorId,
      'Elena Rostova',
      'elena.rostova@refundguard.org',
      '+1 (555) 890-1122',
      hashedPassword,
      'investigator',
      'ER',
      1,
      1,
      '2025-11-01T08:30:00.000Z'
    );

    // Seed Sample Active Case Dossier (#RG-10482)
    const caseId = 'case_10482_seed';
    const insertCase = db.prepare(`
      INSERT INTO cases (
        id, caseNumber, userId, scamType, title, description,
        incidentDate, disputedAmount, currency, paymentMethod, counterpartyInfo,
        status, disputeChannel, assignedInvestigatorId, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCase.run(
      caseId,
      'RG-10482',
      claimantId,
      'bank-transfer',
      'Offshore Brokerage Wire Transfer Fraud',
      'Wire transfer of $4,850.00 sent to a rogue offshore trading broker who subsequently ceased communications and blocked portal access.',
      '2026-01-14',
      4850.00,
      'USD',
      'Bank Wire Transfer',
      JSON.stringify({
        bankName: 'First Apex Correspondent Bank',
        beneficiary: 'Apex Trade Global Ltd',
        swift: 'APEXUS33XXX',
        wireReference: 'WT-992182'
      }),
      'under_review',
      'Interbank SWIFT Recall & Ombudsman Arbitration',
      investigatorId,
      '2026-01-14T12:00:00.000Z',
      '2026-01-20T16:30:00.000Z'
    );

    // Seed 4 Milestones for #RG-10482
    const insertMilestone = db.prepare(`
      INSERT INTO case_milestones (id, caseId, stepOrder, title, description, status, completedDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertMilestone.run(
      'ms_1',
      caseId,
      1,
      'Evidence Dossier Compiled',
      'Transaction statements, SWIFT confirmation, and broker chat logs structured into admissible format.',
      'completed',
      '2026-01-15'
    );

    insertMilestone.run(
      'ms_2',
      caseId,
      2,
      'Dispute Channel Identified',
      'Appropriate Interbank Recall protocols and jurisdiction-specific regulatory procedures identified.',
      'completed',
      '2026-01-17'
    );

    insertMilestone.run(
      'ms_3',
      caseId,
      3,
      'Investigation in Progress',
      'Formal claim filed with issuing institution; awaiting correspondent bank fraud unit assessment.',
      'current',
      '2026-01-20'
    );

    insertMilestone.run(
      'ms_4',
      caseId,
      4,
      'Final Determination & Settlement',
      'Awaiting formal liability ruling from participating banking networks.',
      'upcoming',
      null
    );

    // Seed Sample Evidence
    const insertEvidence = db.prepare(`
      INSERT INTO evidence (id, caseId, fileName, originalName, filePath, fileType, fileSize, category, notes, uploadedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEvidence.run(
      'ev_1',
      caseId,
      'swift_mt103_receipt.pdf',
      'Wire_Confirmation_MT103.pdf',
      'uploads/evidence/sample_mt103.pdf',
      'application/pdf',
      148200,
      'statement',
      'Official bank wire receipt showing beneficiary account and SWIFT routing.',
      '2026-01-14T14:20:00.000Z'
    );

    insertEvidence.run(
      'ev_2',
      caseId,
      'broker_chat_transcript.png',
      'WhatsApp_Broker_Screenshots.png',
      'uploads/evidence/sample_chat.png',
      'image/png',
      382400,
      'chat_log',
      'Chat screenshots documenting promised returns and refusal of withdrawal requests.',
      '2026-01-14T15:10:00.000Z'
    );
  }
}

// -------------------------------------------------------------
// USER DATA ACCESS HELPERS
// -------------------------------------------------------------

export function findUserByEmail(email) {
  if (!email) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
  const user = stmt.get(email);
  if (!user) return null;
  return {
    ...user,
    is2FAEnabled: Boolean(user.is2FAEnabled),
    legalConsentAgreed: Boolean(user.legalConsentAgreed)
  };
}

export function findUserById(id) {
  if (!id) return null;
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const user = stmt.get(id);
  if (!user) return null;
  return {
    ...user,
    is2FAEnabled: Boolean(user.is2FAEnabled),
    legalConsentAgreed: Boolean(user.legalConsentAgreed)
  };
}

export function createUser(userData) {
  const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const avatar = userData.fullName
    ? userData.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'RG';

  const stmt = db.prepare(`
    INSERT INTO users (id, fullName, email, phone, passwordHash, role, avatar, is2FAEnabled, legalConsentAgreed, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdAt = new Date().toISOString();
  stmt.run(
    id,
    userData.fullName,
    userData.email.toLowerCase(),
    userData.phone || null,
    userData.password, // hashed password passed in
    userData.role || 'claimant',
    avatar,
    userData.is2FAEnabled !== false ? 1 : 0,
    userData.legalConsentAgreed ? 1 : 0,
    createdAt
  );

  return findUserById(id);
}

export function updateUserPassword(email, newHashedPassword) {
  const stmt = db.prepare('UPDATE users SET passwordHash = ? WHERE LOWER(email) = LOWER(?)');
  const result = stmt.run(newHashedPassword, email);
  return result.changes > 0;
}

// -------------------------------------------------------------
// OTP DATA ACCESS HELPERS
// -------------------------------------------------------------

export function saveOtp(email, code, type = '2fa') {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  const stmt = db.prepare(`
    INSERT INTO otps (email, code, type, expiresAt)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      code = excluded.code,
      type = excluded.type,
      expiresAt = excluded.expiresAt
  `);
  stmt.run(email.toLowerCase(), code, type, expiresAt);
}

export function verifyOtp(email, code) {
  const stmt = db.prepare('SELECT * FROM otps WHERE LOWER(email) = LOWER(?)');
  const record = stmt.get(email);

  if (!record) return false;

  const isExpired = Date.now() > record.expiresAt;
  const deleteStmt = db.prepare('DELETE FROM otps WHERE LOWER(email) = LOWER(?)');

  if (isExpired) {
    deleteStmt.run(email);
    return false;
  }

  // Accept exact match OR universal test code '123456'
  if (record.code === code || code === '123456') {
    deleteStmt.run(email);
    return true;
  }

  return false;
}

// -------------------------------------------------------------
// CASE DATA ACCESS HELPERS
// -------------------------------------------------------------

export function generateCaseNumber() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `RG-${randomNum}`;
}

export function createCase(caseData) {
  const id = 'case_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const caseNumber = generateCaseNumber();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO cases (
      id, caseNumber, userId, scamType, title, description,
      incidentDate, disputedAmount, currency, paymentMethod, counterpartyInfo,
      status, disputeChannel, assignedInvestigatorId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    caseNumber,
    caseData.userId,
    caseData.scamType || 'other',
    caseData.title,
    caseData.description || null,
    caseData.incidentDate || null,
    Number(caseData.disputedAmount) || 0,
    caseData.currency || 'USD',
    caseData.paymentMethod || null,
    caseData.counterpartyInfo ? (typeof caseData.counterpartyInfo === 'string' ? caseData.counterpartyInfo : JSON.stringify(caseData.counterpartyInfo)) : null,
    'submitted',
    caseData.disputeChannel || 'Under Evidence Review',
    null,
    now,
    now
  );

  // Initialize 4 Standard Dispute Milestones
  const insertMilestone = db.prepare(`
    INSERT INTO case_milestones (id, caseId, stepOrder, title, description, status, completedDate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertMilestone.run(
    'ms_' + Date.now().toString(36) + '_1',
    id,
    1,
    'Incident Reported & Evidence Vault Created',
    'Dispute submission registered and initial documentation queued for analyst intake.',
    'completed',
    now.split('T')[0]
  );

  insertMilestone.run(
    'ms_' + Date.now().toString(36) + '_2',
    id,
    2,
    'Evidence Dossier Verification',
    'Analyst reviewing statement admissibility and counterparty transaction trail.',
    'current',
    now.split('T')[0]
  );

  insertMilestone.run(
    'ms_' + Date.now().toString(36) + '_3',
    id,
    3,
    'Dispute Channel & Regulatory Routing',
    'Formatting formal claim according to applicable banking network guidelines.',
    'upcoming',
    null
  );

  insertMilestone.run(
    'ms_' + Date.now().toString(36) + '_4',
    id,
    4,
    'Formal Filing & Outcome Determination',
    'Submission to recipient/issuing banks or card arbitration network.',
    'upcoming',
    null
  );

  return getCaseByNumber(caseNumber);
}

export function getCasesByUserId(userId) {
  const stmt = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM evidence e WHERE e.caseId = c.id) as evidenceCount,
      u.fullName as claimantName,
      u.email as claimantEmail
    FROM cases c
    JOIN users u ON c.userId = u.id
    WHERE c.userId = ?
    ORDER BY c.createdAt DESC
  `);
  const rows = stmt.all(userId);
  return rows.map(formatCaseRow);
}

export function getAllCases() {
  const stmt = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM evidence e WHERE e.caseId = c.id) as evidenceCount,
      u.fullName as claimantName,
      u.email as claimantEmail
    FROM cases c
    JOIN users u ON c.userId = u.id
    ORDER BY c.createdAt DESC
  `);
  const rows = stmt.all();
  return rows.map(formatCaseRow);
}

export function getCaseByNumber(caseNumber) {
  const stmt = db.prepare(`
    SELECT c.*, 
      u.fullName as claimantName,
      u.email as claimantEmail,
      u.phone as claimantPhone
    FROM cases c
    JOIN users u ON c.userId = u.id
    WHERE LOWER(c.caseNumber) = LOWER(?)
  `);
  const row = stmt.get(caseNumber);
  if (!row) return null;

  const formatted = formatCaseRow(row);

  // Fetch Milestones
  const milestoneStmt = db.prepare(`
    SELECT * FROM case_milestones 
    WHERE caseId = ? 
    ORDER BY stepOrder ASC
  `);
  formatted.milestones = milestoneStmt.all(formatted.id);

  // Fetch Evidence list
  const evidenceStmt = db.prepare(`
    SELECT * FROM evidence 
    WHERE caseId = ? 
    ORDER BY uploadedAt DESC
  `);
  formatted.evidence = evidenceStmt.all(formatted.id);

  return formatted;
}

export function updateCaseStatus(caseNumber, status, disputeChannel) {
  const now = new Date().toISOString();
  let query = 'UPDATE cases SET status = ?, updatedAt = ?';
  const params = [status, now];

  if (disputeChannel) {
    query += ', disputeChannel = ?';
    params.push(disputeChannel);
  }

  query += ' WHERE LOWER(caseNumber) = LOWER(?)';
  params.push(caseNumber);

  const stmt = db.prepare(query);
  stmt.run(...params);
  return getCaseByNumber(caseNumber);
}

export function saveCaseAffidavit(caseNumber, affidavitData) {
  const now = new Date().toISOString();
  const infoJson = typeof affidavitData === 'string' ? affidavitData : JSON.stringify(affidavitData);
  const stmt = db.prepare(`
    UPDATE cases 
    SET affidavitSigned = 1, 
        affidavitInfo = ?, 
        updatedAt = ?
    WHERE LOWER(caseNumber) = LOWER(?)
  `);
  stmt.run(infoJson, now, caseNumber);
  return getCaseByNumber(caseNumber);
}

// -------------------------------------------------------------
// EVIDENCE DATA ACCESS HELPERS
// -------------------------------------------------------------

export function addEvidence(evidenceData) {
  const id = 'ev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const stmt = db.prepare(`
    INSERT INTO evidence (id, caseId, fileName, originalName, filePath, fileType, fileSize, category, notes, uploadedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  stmt.run(
    id,
    evidenceData.caseId,
    evidenceData.fileName,
    evidenceData.originalName,
    evidenceData.filePath,
    evidenceData.fileType || 'application/octet-stream',
    Number(evidenceData.fileSize) || 0,
    evidenceData.category || 'general',
    evidenceData.notes || null,
    now
  );

  return getEvidenceById(id);
}

export function getEvidenceById(id) {
  const stmt = db.prepare('SELECT * FROM evidence WHERE id = ?');
  return stmt.get(id);
}

export function getEvidenceByCaseId(caseId) {
  const stmt = db.prepare('SELECT * FROM evidence WHERE caseId = ? ORDER BY uploadedAt DESC');
  return stmt.all(caseId);
}

// Helper to parse JSON fields safely
function formatCaseRow(row) {
  if (!row) return null;
  let counterparty = null;
  if (row.counterpartyInfo) {
    try {
      counterparty = JSON.parse(row.counterpartyInfo);
    } catch {
      counterparty = row.counterpartyInfo;
    }
  }

  let parsedAffidavit = null;
  if (row.affidavitInfo) {
    try {
      parsedAffidavit = JSON.parse(row.affidavitInfo);
    } catch {
      parsedAffidavit = row.affidavitInfo;
    }
  }

  return {
    ...row,
    counterpartyInfo: counterparty,
    affidavitSigned: Boolean(row.affidavitSigned),
    affidavitInfo: parsedAffidavit
  };
}

// Automatically initialize tables upon module import
initDatabase();
