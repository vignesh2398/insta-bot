import { sendInstagramMessage } from "../../config/privateReply.js";
import Media from "../../model/media.js";


export const getToken= async () => {
  try {
    await User.findOne({ UserId: process.env.INSTAGRAM_USER_ID }).then((user) => {
      if (user) {
        console.log("User found:", user);
        return user.accessToken;
      } else {
        console.log("User not found");
        return null;
      }
    });
  } catch (err) {
    console.error("Error fetching token:", err);
    return null;
  }
};


export const autoReplyModule = async (entries = []) => {
  try {
    console.log("autoReplyModule called with entries:", entries);
    if (!Array.isArray(entries) || entries.length === 0) {
      console.log("No entries to process");
      return;
    }

    const sendTasks = [];
    const igId=entries[0].id
  // console.log("idddd",entries[0].id,"iddd")
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        if (change.field !== "comments") {
          continue;
        }

        const value = change.value || {};
        console.log("Processing comment change:",value)
        if(value?.parent_id){
          console.log("Skipping reply comment:", value.id);
          continue;
        }
        const commentId = value.id;
        const commentText = value.text;
        const userId = value.from?.id;
        const username = value.from?.username;
        const mediaId = value.media?.id;

        if (!commentId || !commentText || !userId || !mediaId) {
          console.warn("Skipping incomplete comment payload", {
            commentId,
            commentText,
            userId,
            mediaId,
            changeValue: value,
          });
          continue;
        }


const mediaData = await Media.find({
  mediaId,
  replyStatus: true,
  $or: [
    { keywords: { $in: commentText.split(" ") } },
    { replyAll: true }
  ]
});

        if (!mediaData.length) {
          console.log("No matching media found for comment:", commentText);
          continue;
        }


          const formattedData = {
          username,
          userId,
          comment: commentText,
          commentId,
          mediaId,
          recipientId: userId,
        };
        for (const data of mediaData) {
          sendTasks.push(
            sendInstagramMessage({
              ...formattedData,
              replyMessage: data.replyMessage,igId
            }).catch((err) => {
              console.error("sendInstagramMessage failed for comment", {
                commentId,
                mediaId,
                userId,
                replyMessage: data.replyMessage,
                error: err.response?.data || err.message || err,
                stack: err.stack,
              });
            })
          );
        }
      }
    }

    if (sendTasks.length) {
      await Promise.allSettled(sendTasks);
    }
  } catch (error) {
    console.log("Error in autoReplyModule", {
      entriesCount: Array.isArray(entries) ? entries.length : 0,
      error: error.response?.data || error.message || error,
      stack: error.stack,
    });
    throw new Error(error.response?.data || error.message || "autoReplyModule failed");
  }
};