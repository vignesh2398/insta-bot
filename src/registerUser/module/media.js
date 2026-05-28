import axios from "axios";

export const getUserMedia = async (accessToken, igUserId) => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/${igUserId}/media`,
      {
        params: {
          fields: "id,caption,media_type,permalink,timestamp",
          access_token: accessToken,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching Instagram media:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch Instagram media");
  }
};
