import { generateAccessToken } from "../../config/acessToken.js";
import { ValidateUser } from "../module/registerUser.js";

export const redirectUrl = () => {
  try {
    const baseUrl = process.env.baseURl;

    const params = new URLSearchParams({
      force_reauth: "true",
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      redirect_uri: process.env.REDIRECT_URI,
      response_type: "code",
      scope: process.env.INSTAGRAM_SCOPES,
    });

    return `${baseUrl}?${params.toString()}`;

  } catch (error) {
    console.error("Error in redirectUrl generation:", error);

    throw new Error("Error in redirectUrl generation");
  }
};

export const validateUser = async (code) => {
  try {

    await ValidateUser(code);

    // Here you would typically exchange the code for an access token
    // and validate the user. This is a placeholder for demonstration.
    return "User validated successfully!";
  } catch (error) {
    console.error("Error in user validation:", error);
    throw new Error("Error in user validation");
  }
};
