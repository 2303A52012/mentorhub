import mongoose from 'mongoose';

const problemReviewSchema = new mongoose.Schema({
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  feedback: {
    type: String,
    default: ''
  },
  correctionRequired: {
    type: Boolean,
    default: false
  }
});

const taskReviewSchema = new mongoose.Schema(
  {
    menteeTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenteeTask',
      required: true
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskSubmission',
      required: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    decision: {
      type: String,
      enum: ['APPROVED', 'RESUBMISSION_REQUIRED'],
      required: true
    },
    overallFeedback: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      default: null
    },
    problemReviews: [problemReviewSchema],
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const TaskReview = mongoose.model('TaskReview', taskReviewSchema);
