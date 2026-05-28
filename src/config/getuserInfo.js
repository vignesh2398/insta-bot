import axios from "axios";

export const getUserInfo = async (token) => {
    try {
      // Find Google user and get their first Instagram account
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
        return userResponse;
    } catch (error) {
      console.error("Error fetching user info:", error);
      throw error;
    }
  };