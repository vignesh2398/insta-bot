async function sendInstagramMessage(RECIPIENT_ID,ACCESS_TOKEN) {
  try {
    const response = await axios.post(
      `https://graph.instagram.com/v25.0/me/messages`,
      {
        recipient: {
          id: RECIPIENT_ID,
        },
        message: {
          text: "Hello from Instagram API 🚀",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
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