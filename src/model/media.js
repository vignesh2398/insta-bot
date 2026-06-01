import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    /* ── Core ─────────────────────────────────── */
    UserId: {
      type: String,
      required: true,
      index: true,
    },
    mediaId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /* ── Basic automation ─────────────────────── */
    replyStatus: {
      type: Boolean,
      default: false,
    },
    replyAll: {
      type: Boolean,
      default: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    replyMessage: {
      type: String,
      default: '',
    },

    /* ── Smart controls (NEW) ─────────────────── */
    oneDmPerUser: {
      type: Boolean,
      default: true,
    },
    excludeFollowers: {
      type: Boolean,
      default: false,
    },
    rotateMessages: {
      type: Boolean,
      default: false,
    },
    personalizeMessage: {
      type: Boolean,
      default: true,
    },
    messageVariants: {
      type: [String],
      default: [],
    },

    /* ── Analytics counters (NEW) ─────────────── */
    dmsSent: {
      type: Number,
      default: 0,
    },
    dmsFailed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Media = mongoose.model('Media', mediaSchema);

export default Media;