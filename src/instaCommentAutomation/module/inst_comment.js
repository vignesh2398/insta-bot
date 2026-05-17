import { sendInstagramMessage } from "../../config/privateReply.js";
import Media from "../../model/media.js";
import User from "../../model/user.js";

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
    let formattedData;
// let accountId=      entries.id
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
           formattedData = {
            username,
            userId,
            comment: commentText,
            commentId,
            mediaId,
            recipientId: userId,
          };
       
        }
      });
    });
    // check mediaID and comment text from DB
 const mediaData=   await Media.find({
  mediaId: formattedData.mediaId,
  commentText: formattedData.comment.toLowerCase() 
})
if(mediaData.length===0){
  console.log("No matching media found for comment:", formattedData.comment);
  return;
}

mediaData.forEach((data)=>{
  formattedData.replyMessage=data.replyMessage;
    sendInstagramMessage(formattedData);
})

  } catch (error) {
    console.log(error," Error in autoReplyModule");
 throw new Error(error.response?.data);    
  }
};