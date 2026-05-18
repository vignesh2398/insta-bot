import { generateAccessToken, userDetails } from "../../config/acessToken.js";
import User from "../../model/user.js";

export const ValidateUser = async (code) => {
  try {
    const token = await generateAccessToken(code);
    const userDetail = await userDetails(token.access_token);
    console.log("Access token generated:", token);
    console.log("User details fetched:", userDetail);
    const existingUser = await User.findOne({ userid: userDetail.user_id });
    if (existingUser) {
      console.log("User already exists:", existingUser);
      return "User already validated!";
    }
   const user = await User.create({
    id: userDetail.id,
    userid: userDetail.user_id,
    username: userDetail.username,
    account_type: userDetail.account_type,
    accessToken: token.access_token,
    expiresIn: token.expires_in,
   })
   console.log("User created:", user);
    return "User validated successfully!";
  } catch (error) {
    console.error("Error validating user:", error);
    throw new Error("Error validating user");
  }
};