import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full legal name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Valid email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    default: null,
    trim: true
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  role: {
    type: String,
    enum: ['claimant', 'investigator', 'admin'],
    default: 'claimant'
  },
  avatar: {
    type: String,
    default: 'RG'
  },
  is2FAEnabled: {
    type: Boolean,
    default: true
  },
  legalConsentAgreed: {
    type: Boolean,
    default: true
  },
  walletBalance: {
    type: Number,
    default: 0
  },
  withdrawalAllowed: {
    type: Boolean,
    default: false
  },
  clearanceFeePaid: {
    type: Boolean,
    default: false
  },
  walletTransactions: [{
    type: {
      type: String,
      enum: ['settlement_credit', 'withdrawal', 'fee_rebate'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    caseNumber: {
      type: String,
      default: null
    },
    description: {
      type: String,
      default: ''
    },
    method: {
      type: String,
      default: 'direct_credit'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: ['completed', 'processing', 'pending', 'pending_clearance', 'rejected'],
      default: 'completed'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to return safe JSON without passwordHash
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', UserSchema);
export default User;
