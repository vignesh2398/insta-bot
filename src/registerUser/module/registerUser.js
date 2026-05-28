import { generateAccessToken, userDetails } from "../../config/acessToken.js";
import User from "../../model/user.js";


export const ValidateUser = async (code, googleId) => {
  try {
    const token = await generateAccessToken(code);
    const userDetail = await userDetails(token.access_token);
    console.log("Access token generated:", token);
    console.log("User details fetched:", userDetail);

    // Find the Google user
    const googleUser = await User.findOne({ googleId });
    if (!googleUser) {
      throw new Error(`Google user with ID ${googleId} not found`);
    }

    // Check if Instagram account already linked
    const accountExists = googleUser.instagramAccounts.some(
      (acc) => acc.instagramId === userDetail.id
    );

    if (accountExists) {
      console.log("Instagram account already linked");
      return "Instagram account already linked!";
    }

    // Push Instagram account to user's instagramAccounts array
    googleUser.instagramAccounts.push({
      instagramId: userDetail.id,
      username: userDetail.username,
      profilePicture: userDetail.picture || "",
      id: userDetail.id,
      userid: userDetail.user_id,
      account_type: userDetail.account_type,
      accessToken: token.access_token,
      expiresIn: token.expires_in,
    });

    await googleUser.save();
    console.log("Instagram account linked:", googleUser);
    return "Instagram account validated successfully!";
  } catch (error) {
    console.error("Error validating user:", error);
    throw new Error("Error validating user");
  }
};