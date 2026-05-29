import axios from "axios";


          //  formattedData = {
          //   username,
          //   userId,
          //   comment: commentText,
          //   commentId,
          //   mediaId,
          //   recipientId: userId,
          // };

export const sendInstagramMessage = async (data) => {
    try {

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
          Authorization: `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`,
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
          access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
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