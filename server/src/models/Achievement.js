import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: 'Award'
    },
    points: {
      type: Number,
      default: 50
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Achievement = mongoose.model('Achievement', achievementSchema);

const menteeAchievementSchema = new mongoose.Schema(
  {
    menteeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement',
      required: true
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

menteeAchievementSchema.index({ menteeId: 1, achievementId: 1 }, { unique: true });

export const MenteeAchievement = mongoose.model(
  'MenteeAchievement',
  menteeAchievementSchema
);
