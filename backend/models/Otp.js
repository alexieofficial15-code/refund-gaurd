import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['2fa', 'reset'],
    default: '2fa'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Mongo automatic TTL index: document will self-delete when expiresAt timestamp arrives!
  }
}, {
  timestamps: true
});

export const Otp = mongoose.model('Otp', OtpSchema);
export default Otp;
