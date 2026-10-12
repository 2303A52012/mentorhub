import mongoose from 'mongoose';

const mentorMenteeAssignmentSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

mentorMenteeAssignmentSchema.index({ mentorId: 1, menteeId: 1 }, { unique: true });

export const MentorMenteeAssignment = mongoose.model(
  'MentorMenteeAssignment',
  mentorMenteeAssignmentSchema
);
