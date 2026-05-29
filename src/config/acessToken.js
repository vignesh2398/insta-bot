import axios from "axios";

export const generateAccessToken = async (code) => {
  try {
    const response = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: process.env.REDIRECT_URI,
        code,
      }),
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );
const longToken=await axios.get(
  "https://graph.instagram.com/access_token",
  {
    params: {
      grant_type: "ig_exchange_token",
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      access_token: response.data.access_token,
    },
  }
);


    return {...longToken.data};

//     const response = await axios.get(
//   "https://graph.instagram.com/me",
//   {
//     params: {
//       fields: "id,username",
//       access_token: accessToken,
//     },
//   }
// );
  } catch (error) {
    console.error(
      "Error generating access token:",
      error.response?.data || error.message
    );

    throw  Error("Failed to generate access token");
  }
};

export const userDetails = async (accessToken) => {
  try {
    const response = await axios.get(
      "https://graph.instagram.com/me",
      {
        params: {
          fields: "id,username,account_type,user_id,profile_picture_url",
          access_token: accessToken,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching user details:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch user details");
  }
};

