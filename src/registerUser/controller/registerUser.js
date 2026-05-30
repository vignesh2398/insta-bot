import { generateAccessToken } from "../../config/acessToken.js";
import { ValidateUser } from "../module/registerUser.js";
import { getUserMedia } from "../module/media.js";
import User from "../../model/user.js";
import Media from "../../model/media.js";

export const redirectUrl = () => {
  try {
    const baseUrl = process.env.baseURl;

const params = new URLSearchParams({
  client_id: process.env.INSTAGRAM_CLIENT_ID,
  redirect_uri: process.env.REDIRECT_URI,
  response_type: "code",
  scope: process.env.INSTAGRAM_SCOPES,
  auth_type: "rerequest",
});
    return `${baseUrl}?${params.toString()}`;

  } catch (error) {
    console.error("Error in redirectUrl generation:", error);

    throw new Error("Error in redirectUrl generation");
  }
};

export const validateUser = async (code, googleId) => {
  try {
    await ValidateUser(code, googleId);
    return "Instagram account validated successfully!";
  } catch (error) {
    console.error("Error in user validation:", error);
    throw error;
  }
};

const getInstagramAccessTokenFromDb = async (googleId) => {
  const user = await User.findOne({ googleId });

  if (!user || !user.instagramAccounts?.length) {
    throw new Error(`No Instagram accounts found for user ${googleId}`);
  }

  const instagramAccount = user.instagramAccounts[0];
  if (!instagramAccount.accessToken) {
    throw new Error(`No access token stored for Instagram account`);
  }

  return instagramAccount.accessToken;
};

export const getMedia = async ({googleId, profilePicture, username, next}) => {
  try {
    if (!googleId) {
      throw new Error("Missing googleId parameter");
    }

    // Find Google user and get their first Instagram account
    const user = await User.findOne({ googleId });
    if (!user) {
      throw new Error(`Google user ${googleId} not found`);
    }

    if (!user.instagramAccounts || user.instagramAccounts.length === 0) {
      throw new Error(`No Instagram accounts linked for user ${googleId}`);
    }

    const igAccount = user.instagramAccounts[0];
    const igUserId = igAccount.instagramId;
    const accessToken = igAccount.accessToken;

    if (!accessToken) {
      throw new Error("No access token stored for Instagram account");
    }

    const media = await getUserMedia({accessToken, igUserId, nextPageToken: next});



    return { ...media, profilePicture, username ,"next": media.nextPageToken};
  } catch (error) {
    console.error("Error in media retrieval:", error);
    throw error;
  }
};