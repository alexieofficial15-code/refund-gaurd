import mongoose from 'mongoose';

const MilestoneSchema = new mongoose.Schema({
  stepOrder: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['completed', 'current', 'upcoming'],
    default: 'upcoming'
  },
  completedDate: {
    type: String,
    default: null
  }
}, { _id: true });

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['claimant', 'specialist', 'system'],
    default: 'claimant'
  },
  senderName: {
    type: String,
    default: 'Claimant'
  },
  text: {
    type: String,
    required: true
  },
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const CaseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scamType: {
    type: String,
    required: true,
    default: 'Online Shopping Scam'
  },
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  incidentDate: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  disputedAmount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be non-negative']
  },
  settledAmount: {
    type: Number,
    default: 0
  },
  settledAt: {
    type: Date,
    default: null
  },
  settlementFlashPending: {
    type: Boolean,
    default: false
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  paymentMethod: {
    type: String,
    default: 'Bank Wire / Transfer'
  },
  counterpartyInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'dispute_routing', 'settlement_pending', 'resolved', 'withdrawn'],
    default: 'submitted',
    index: true
  },
  disputeChannel: {
    type: String,
    default: 'Under Evidence Review'
  },
  assignedInvestigatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  affidavitSigned: {
    type: Boolean,
    default: false
  },
  affidavitInfo: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  withdrawalAllowed: {
    type: Boolean,
    default: false
  },
  clearanceFeePaid: {
    type: Boolean,
    default: false
  },
  milestones: [MilestoneSchema],
  messages: [MessageSchema]
}, {
  timestamps: true
});

// Static helper to generate unique Case Number (e.g. RG-94821)
CaseSchema.statics.generateCaseNumber = function () {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `RG-${randomNum}`;
};

export const Case = mongoose.model('Case', CaseSchema);
export default Case;
