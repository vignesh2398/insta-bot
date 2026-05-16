import { generateAccessToken } from "../../config/acessToken.js";
import User from "../../model/user.js";

export const ValidateUser = async (code) => {
  try {
    const token = await generateAccessToken(code);
    const existingUser = await User.findOne({ UserId: token.user_id });
    if (existingUser) {
      console.log("User already exists:", existingUser);
      return "User already validated!";
    }
   const user = await User.create({
    UserId: token.user_id,
    accessToken: token.access_token
   })
   console.log("User created:", user);
    return "User validated successfully!";
  } catch (error) {
    console.error("Error validating user:", error);
    throw new Error("Error validating user");
  }
};