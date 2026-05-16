import axios from "axios";

export const sendInstagramMessage = async (data) => {
    try {
    const INSTAGRAM_API_URL = `https://graph.instagram.com/v25.0/${data.commentId}/messages`;
    const response = await axios.post(
      INSTAGRAM_API_URL,
      {
        recipient: {
          id: data.recipientId, // recipient IG user id
        },
        message: {
          text: "test reply", // message text
        },
      },
      {
        headers: {
          Authorization: `Bearer ${data.ACCESS_TOKEN}`,
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
  }
}