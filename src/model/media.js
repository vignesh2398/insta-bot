import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    UserId: {
      type: String,
      required: true,
      trim: true,
    },

    mediaId: {
      type: String,
      required: true,
      unique: true,
    },
    
    replyMessage: {
      type: String,
    },
    replyStatus: {
      type: Boolean, 
    }
  },
  {
    timestamps: true,
  }
);

const Media = mongoose.model("Media", mediaSchema);

export default Media;