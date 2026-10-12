import mongoose from 'mongoose';

const problemProgressSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

const menteeTaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: [
        'UPCOMING',
        'IN_PROGRESS',
        'SUBMITTED',
        'UNDER_REVIEW',
        'RESUBMISSION_REQUIRED',
        'APPROVED',
        'OVERDUE',
        'CLOSED'
      ],
      default: 'IN_PROGRESS'
    },
    problemProgress: [problemProgressSchema],
    assignedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: {
      type: Date
    },
    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

menteeTaskSchema.index({ taskId: 1, menteeId: 1 }, { unique: true });

export const MenteeTask = mongoose.model('MenteeTask', menteeTaskSchema);
