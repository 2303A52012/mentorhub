import mongoose from 'mongoose';

const codingProfileSchema = new mongoose.Schema(
  {
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    linkedinUrl: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },
    leetcodeUrl: {
      type: String,
      default: ''
    },
    codechefUrl: {
      type: String,
      default: ''
    },
    codeforcesUrl: {
      type: String,
      default: ''
    },
    hackerrankUrl: {
      type: String,
      default: ''
    },
    gfgUrl: {
      type: String,
      default: ''
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    customProfiles: [
      {
        label: { type: String, required: true },
        url: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

export const CodingProfile = mongoose.model('CodingProfile', codingProfileSchema);
