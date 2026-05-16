import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    UserId: {
      type: String,
      required: true,
      trim: true,
    },

    accessToken: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;