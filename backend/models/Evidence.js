import mongoose from 'mongoose';

const EvidenceSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  caseNumber: {
    type: String,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'application/octet-stream'
  },
  fileSize: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    default: 'general'
  },
  notes: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const Evidence = mongoose.model('Evidence', EvidenceSchema);
export default Evidence;
