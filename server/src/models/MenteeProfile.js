import mongoose from 'mongoose';

const menteeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    mobile: {
      type: String,
      default: ''
    },
    branch: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    academicYear: {
      type: Number,
      default: 2027
    },
    section: {
      type: String,
      default: 'A'
    },
    skills: {
      type: [String],
      default: []
    },
    interests: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const MenteeProfile = mongoose.model('MenteeProfile', menteeProfileSchema);
