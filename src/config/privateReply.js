import axios from "axios";
import User from "../model/user.js";
export const getInstagramAccessTokenFromDB = async (igId) => {
  try {
const token=await User.findOne({"instagramAccounts.userid": igId})
return token ? token.instagramAccounts[0].accessToken : null;
  } catch (err) {
    console.error("Error fetching Instagram access token from DB:", err);
    return null;
  }
};

export const sendInstagramMessage = async (data) => {
    try {

      // get IG access token from DB
      const igAccessToken = await getInstagramAccessTokenFromDB(data.igId);
      if (!igAccessToken) {
        throw new Error("Instagram access token not found in database");
      }
      console.log("Sending message with data:", data);
    const INSTAGRAM_API_URL = `https://graph.instagram.com/v25.0/me/messages`;
    const response = await axios.post(
      INSTAGRAM_API_URL,
  {
  "recipient": {
    "comment_id": data.commentId
  },
  "message": {
    "text": data.replyMessage
  }
},
      {
        headers: {
          Authorization: `Bearer ${igAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // comment reply
const publicCommentReply=["Hi, thanks for the comment.", "Check DM 📨", "Sure", "can you check the Inbox? 🙂" ];
    const publicReply = await axios.post(
      `https://graph.instagram.com/v25.0/${data.commentId}/replies`,
      new URLSearchParams({
        message:  publicCommentReply[Math.floor(Math.random() * publicCommentReply.length)],
      }),
      {
        params: {
          access_token: igAccessToken,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log(publicReply.data);
 



    console.log("Message sent:", response.data);
  } catch (error) {
    console.error(
      "Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send message");
  }
}