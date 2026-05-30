import { sendInstagramMessage } from "../../config/privateReply.js";
import Media from "../../model/media.js";
import User from "../../model/user.js";

export const getToken= async () => {
  try {
    await User.findOne({ UserId: process.env.INSTAGRAM_USER_ID }).then((user) => {
      if (user) {

        return user.accessToken;
      } else {

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
    console.log("entries",entries,"entries")
    if (!Array.isArray(entries) || entries.length === 0) {
      return;
    }
    console.log("idddd",entries[0].id,"iddd")

    const sendTasks = [];

    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        if (change.field !== "comments") {
          continue;
        }

        const value = change.value || {};
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

        const formattedData = {
          username,
          userId,
          comment: commentText,
          commentId,
          mediaId,
          recipientId: userId,
        };

        const mediaData = await Media.find({
          mediaId,
          commentText: commentText.toLowerCase(),
        });

        if (!mediaData.length) {
          console.log("No matching media found for comment:", commentText);
          continue;
        }

        for (const data of mediaData) {
          sendTasks.push(
            sendInstagramMessage({
              ...formattedData,
              replyMessage: data.replyMessage,
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
    console.error("Error in autoReplyModule", {
      entriesCount: Array.isArray(entries) ? entries.length : 0,
      error: error.response?.data || error.message || error,
      stack: error.stack,
    });
    throw new Error(error.response?.data || error.message || "autoReplyModule failed");
  }
};
