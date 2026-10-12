import mongoose from 'mongoose';

const taskSubmissionSchema = new mongoose.Schema(
  {
    menteeTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenteeTask',
      required: true
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    problemSnapshot: [
      {
        problemId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        notes: {
          type: String,
          default: ''
        }
      }
    ],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    submittedLate: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export const TaskSubmission = mongoose.model('TaskSubmission', taskSubmissionSchema);
