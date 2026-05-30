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



  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === "my_instagram_webhook_12") {
    return res.type("text/plain").status(200).send(challenge);
  }
      
  }catch(err){
    console.error("Error in callback:", err);
  return res.sendStatus(403);
  }
});

router.post("/webhook", async (req, res, next) => {
  try {
    console.log("dsfffffffffff",req.body,"ddsfsf")
    autoReply(req.body).catch((err) => {
      console.error("Async autoReply failed", {
        requestBody: req.body,
        error: err.message || err,
        stack: err.stack,
      });
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error("Error in webhook POST callback", {
      requestBody: req.body,
      error: err.message || err,
      stack: err.stack,
    });
    next(err);
  }
});
export default router;
