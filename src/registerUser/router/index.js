import express from 'express';
import { redirectUrl, validateUser } from '../controller/registerUser.js';
import { autoReply } from '../../instaCommentAutomation/controller/autoReply.js';
const router = express.Router();

router.get('/redirecturl', async (req,res,next) => {
  try {
const result=await redirectUrl()
res.json({message:result});
  } catch (err) {
    next(err);
  }
});

router.get('/callback', async (req,res,next) => {
  try {
  const code = req.query.code;
     await validateUser(code);
    res.json({message:"asdasda route is working!"});
  }
  catch (err) {
    next(err);
  }
}
);

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

router.post("/webhook", (req, res,next) => {
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