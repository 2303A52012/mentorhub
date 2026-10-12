import mongoose from 'mongoose';

const mentorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    rollNumber: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: 'Computer Science & Engineering'
    },
    designation: {
      type: String,
      default: 'Technical Mentor & Faculty Lead'
    },
    maxMentees: {
      type: Number,
      default: 50
    },
    bio: {
      type: String,
      default: 'Specializing in Data Structures, Algorithms, and System Design.'
    }
  },
  {
    timestamps: true
  }
);

export const MentorProfile = mongoose.model('MentorProfile', mentorProfileSchema);
