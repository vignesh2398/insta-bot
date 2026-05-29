import express from 'express';
import { getMedia, redirectUrl, validateUser } from '../controller/registerUser.js';
import { autoReply } from '../../instaCommentAutomation/controller/autoReply.js';
import { generateAccessToken, userDetails } from '../../config/acessToken.js';
import User from '../../model/user.js';
const router = express.Router();

router.get('/redirecturl', async (req,res,next) => {
  try {
const result=await redirectUrl()
res.json({message:result});
  } catch (err) {
    next(err);
  }
});


router.get('/media', async (req,res,next) => {
  try {
    const googleId = req.user.id;
    const result = await getMedia(googleId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});



router.get('/callback', async (req,res,next) => {
  try {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).json({error: "Missing authorization code"});
  }
const data=await generateAccessToken(code)
const userDetail=await userDetails(data.access_token)

// import User from "./src/model/user.js";
const accountData = {
  instagramId: userDetail.id,
  username: userDetail.username,
  profilePicture: userDetail.profile_picture_url || "",
  id: userDetail.id,
  userid: userDetail.user_id,
  account_type: userDetail.account_type,
  accessToken: data.access_token,
  expiresIn: data.expires_in,
};

const resd=await User.addInstagramAccount(req.user.id, accountData);

    res.json({message:"Instagram account linked successfully!", resd});
  }
  catch (err) {
    next(err);
  }
}
);



// need to put in no auth routes 
router.get('/webhook', async (req,res,next) => {
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

router.post("/webhook",async (req, res,next) => {
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


export default router;