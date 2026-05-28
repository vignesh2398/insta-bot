import mongoose from "mongoose";

const instagramAccountSchema = new mongoose.Schema(
  {
    instagramId: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    
    refreshToken: {
      type: String,
      required: true,
    },
    tokenExpiresAt: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const InstagramAccount = mongoose.model("InstagramAccount", instagramAccountSchema);

export default InstagramAccount;