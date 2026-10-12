import mongoose from 'mongoose';

const importHistorySchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number
    },
    fileType: {
      type: String
    },
    importMode: {
      type: String,
      enum: ['CREATE', 'UPDATE'],
      default: 'CREATE'
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalRows: {
      type: Number,
      default: 0
    },
    validRows: {
      type: Number,
      default: 0
    },
    invalidRows: {
      type: Number,
      default: 0
    },
    studentsCreated: {
      type: Number,
      default: 0
    },
    studentsUpdated: {
      type: Number,
      default: 0
    },
    studentsSkipped: {
      type: Number,
      default: 0
    },
    mentorsCreated: {
      type: Number,
      default: 0
    },
    mentorsUpdated: {
      type: Number,
      default: 0
    },
    relationshipsCreated: {
      type: Number,
      default: 0
    },
    relationshipsUpdated: {
      type: Number,
      default: 0
    },
    failedCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED', 'PARTIAL'],
      default: 'COMPLETED'
    },
    summaryDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    errorDetails: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const ImportHistory = mongoose.model('ImportHistory', importHistorySchema);
