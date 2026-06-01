import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    mediaId: {
      type: String,
      required: true,
      index: true,
    },
    instagramId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    userId: {
      type: String, // Instagram user ID of the commenter
    },
    keyword: {
      type: String,
      default: null, // null means triggered by replyAll
    },
    commentId: {
      type: String, // Instagram comment ID that triggered the DM
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      required: true,
      index: true,
    },
    error: {
      type: String,
      default: null, // error message if status === 'failed'
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Compound index for fast queries by post + account + date
activityLogSchema.index({ mediaId: 1, instagramId: 1, createdAt: -1 });
activityLogSchema.index({ mediaId: 1, instagramId: 1, status: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;