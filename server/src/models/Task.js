import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  problemUrl: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    enum: ['LEETCODE', 'CODECHEF', 'CODEFORCES', 'HACKERRANK', 'CUSTOM'],
    default: 'LEETCODE'
  },
  position: {
    type: Number,
    required: true,
    default: 1
  }
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    weekNo: {
      type: Number,
      required: true
    },
    assignmentDate: {
      type: Date,
      required: true
    },
    lastDate: {
      type: Date,
      required: true
    },
    instructions: {
      type: String,
      default: ''
    },
    problems: [problemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    targetType: {
      type: String,
      enum: ['INDIVIDUAL', 'SELECTED', 'BATCH', 'ALL'],
      default: 'ALL'
    },
    targetIds: [
      {
        type: mongoose.Schema.Types.ObjectId
      }
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED'],
      default: 'PUBLISHED'
    }
  },
  {
    timestamps: true
  }
);

export const Task = mongoose.model('Task', taskSchema);
