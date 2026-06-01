import mongoose from "mongoose";

const instagramAccountSchema = new mongoose.Schema(
  {
    instagramId: {
      type: String,
      required: true,
    },
    DMCount:{
      type:Number
    },
    username: {
      type: String,
      required: true,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    // OAuth token & identifiers
    id: {
      type: String,
    },
    userid: {
      type: String,
    },
    account_type: {
      type: String,
    },
    accessToken: {
      type: String,
    },
    expiresIn: {
      type: Number,
    },
    // optional refresh token (if using long-lived flow)
    refreshToken: {
      type: String,
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

const googleAuthSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    picture: {
      type: String,
      default: "",
    },

    instagramAccounts: [instagramAccountSchema],

    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

googleAuthSchema.statics.addInstagramAccount = async function (googleId, instagramAccount) {
  const updatedUser = await this.findOneAndUpdate(
    {
      googleId,
      "instagramAccounts.instagramId": { $ne: instagramAccount.instagramId },
    },
    {
      $push: { instagramAccounts: instagramAccount },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedUser) {
    throw new Error("User not found or Instagram account already linked");
  }

  return updatedUser;
};

googleAuthSchema.statics.removeInstagramAccount = async function (googleId) {
  const updatedUser = await this.findOneAndUpdate(
    { googleId },
    { $set: { instagramAccounts: [] } },
    { new: true }
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return updatedUser;
};

const User = mongoose.model("User", googleAuthSchema);

export default User;