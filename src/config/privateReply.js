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
          Authorization: `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Message sent:", response.data);
  } catch (error) {
    console.error(
      "Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send message");
  }
}