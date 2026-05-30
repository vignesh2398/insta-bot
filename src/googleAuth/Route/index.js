import axios from "axios";
import { generateGoogleAuthUrl } from "../controller/oauthurl.js";
import express from 'express';
import User from "../../model/user.js";
import { getUserInfo } from "../../config/getuserInfo.js";
import { autoReply } from "../../instaCommentAutomation/controller/autoReply.js";
      import { verifyMetaSignature } from "../../config/signatureVerification.js";
const outhrouter = express.Router();

outhrouter.get("/redirectUrl",async (req, res,next) => {
    try {
        const authUrl = generateGoogleAuthUrl();
        
        res.json({ message: authUrl });
    }catch(err){
        console.error("Error in callback:", err);
        next(err);
    }

});

outhrouter.get("/google/callback", async (req, res, next) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code missing",
      });
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const tokens = tokenResponse.data;

    // Fetch Google user info
    const userResponse = await getUserInfo(tokens.access_token);

    const googleUser = userResponse.data;
    // Check existing user
    let user = await User.findOne({
      googleId: googleUser.id,
    });

    // Create new user if not exists
    if (!user) {
      user = await User.create({
        googleId: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        // instagramAccounts: [],
      });
    } else {
      // Update existing user
      user.name = googleUser.name;
      user.picture = googleUser.picture;
      user.lastLogin = new Date();

      await user.save();
    }

    const cookieOptions = {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "none",
      maxAge: tokens.expires_in ? tokens.expires_in * 1000 : 24 * 60 * 60 * 1000,

    };

    return res
      .status(200)
      .cookie("token", tokens.access_token, cookieOptions)
      .json({
        success: true,
        message: "Google login successful",
        googleId: googleUser.id,
        user: user.instagramAccounts.length > 0 ? true : false,
      });

  } catch (err) {
    console.error(
      "Error in callback:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      success: false,
      message: "Google authentication failed",
      error: err.response?.data || err.message,
    });
  }
});
// need to put in no auth routes 
outhrouter.get('/webhook', async (req,res,next) => {
  try{

  console.log("QUERY:", req.query);

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === "my_instagram_webhook_12") {
    console.log("WEBHOOK VERIFIED");
    return res.type("text/plain").status(200).send(challenge);
  }
      
  }catch(err){
    console.error("Error in callback:", err);
  return res.sendStatus(403);
  }
});
outhrouter.post("/webhook",verifyMetaSignature,async (req, res,next) => {
    try {
      console.log("WEBHOOK EVENT:");
      console.log(JSON.stringify(req.body, null, 2));
      const result = await autoReply(req.body)

  res.sendStatus(200);
    }catch(err){
        console.error("Error in callback:", err);
        next(err);
    }

});


export default outhrouter;