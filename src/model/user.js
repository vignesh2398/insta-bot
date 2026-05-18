import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    userid: {
      type: String,
      required: true,
      trim: true,
    },
    username:{
      type: String,
      required: true,
      trim: true,
    },
    account_type:{
      type: String,
      required: true,
      trim: true,
    },
    accessToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresIn: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;