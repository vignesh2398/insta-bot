import express from 'express';
import { getMedia, redirectUrl, validateUser } from '../controller/registerUser.js';
import { autoReply } from '../../instaCommentAutomation/controller/autoReply.js';
import { generateAccessToken, userDetails } from '../../config/acessToken.js';
import User from '../../model/user.js';
    import { getInstagramUserDetails, updateInstagramMedia } from '../../config/instagramUserDetails.js';
const router = express.Router();

router.get('/redirecturl', async (req,res,next) => {
  try {
const result=await redirectUrl()
res.json({message:result});
  } catch (err) {
    next(err);
  }
});
router.get('/profile', async (req,res,next) => {
  try {
  res.json({profilePicture: req.user.picture, username: req.user.given_name});
  } catch (err) {
    next(err);
  } 
});

router.get('/media', async (req,res,next) => {
  try {
    const googleId = req.user.id;
    const result = await getMedia({googleId, profilePicture: req.user.picture, username: req.user.given_name,next: req.query.next});
    res.json(result);
  } catch (err) {
    next(err);
  }
});
router.delete('/removeAccount', async (req,res,next) => {
  try {
    const googleId = req.user.id;
    const result = await User.removeInstagramAccount(googleId);

    res.json({message:"Instagram account removed successfully!", result});
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

// check does the same account is linked to someohter account or not
const existingUser = await User.findOne({ "instagramAccounts.instagramId": userDetail.id });
if (existingUser) {
  return res.status(400).json({ error: "This Instagram account is already linked to another user." });
}
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

router.post('/automation', async (req,res,next) => {
  try {
  const igAccount = await getInstagramUserDetails(req.user.id);
  if (!igAccount) {
    return res.status(404).json({ error: "Instagram account not found for user" });
  }
  await updateInstagramMedia({data: req.body, instagramId: igAccount.userid});
  res.json({message:"Automation settings updated successfully!"});
}
  catch (err) {
    next(err);
  }   
});
router.get('/logout', async (req,res,next) => {
  try {
    res.clearCookie('token'); 
    res.json({message:"Logged out successfully!"});
  } catch (err) {
    next(err);
  }});




export default router;