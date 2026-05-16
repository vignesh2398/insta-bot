import { sendInstagramMessage } from "../../config/privateReply.js";
import User from "../../model/user";

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


export const autoReplyModule = async(entries=[]) => {
  try {

    entries.forEach((entry) => {
      const changes = entry.changes || [];

      changes.forEach((change) => {
        if (change.field === "comments") {
          const value = change.value;

          // COMMENT DETAILS
          const commentId = value.id;
          const commentText = value.text;

          // USER DETAILS
          const userId = value.from?.id;
          const username = value.from?.username;

          // MEDIA DETAILS
          const mediaId = value.media?.id;

          console.log("========== COMMENT RECEIVED ==========");
          console.log("Username:", username);
          console.log("User ID:", userId);
          console.log("Comment:", commentText);
          console.log("Comment ID:", commentId);
          console.log("Media ID:", mediaId);

          // Example object
          const formattedData = {
            username,
            userId,
            comment: commentText,
            commentId,
            mediaId,
            recipientId: userId,
            ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN
          };
          //  sendInstagramMessage(formattedData);
          if(mediaId==process.env.MEDIA_ID && commentText==process.env.COMMENT_TEXT ){
            console.log("MATCH FOUND! COMMENT:", formattedData);
            console.log(formattedData);
          }         
        }
      });
    });
  } catch (error) {

    console.log(
      error.response?.data || error.message
    );
 throw new Error(error.response?.data);    
  }
};