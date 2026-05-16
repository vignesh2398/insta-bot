import express from 'express';
import { autoReply } from '../controller/autoReply';
const router = express.Router();

router.get('/auth/callback', async (req,res,next) => {
  try {
const result = await autoReply(req.body)
res.json(result);
  } catch (err) {
    next(err);
  }
});

// router.post("/auth/callback", (req, res) => {
//     try {
//   console.log("WEBHOOK EVENT:");
//   console.log(JSON.stringify(req.body, null, 2));

//   res.sendStatus(200);
//     }catch(err){
//         console.error("Error in callback:", err);
//         return res.sendStatus(403);
//     }

// });

// router.get("/auth/callback", (req, res) => {
//   console.log("CALLBACK RECEIVED");
//   try{

//   console.log("QUERY:", req.query);

//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === VERIFY_TOKEN) {
//     console.log("WEBHOOK VERIFIED");
//     return res.type("text/plain").status(200).send(challenge);
//   }
      
//   }catch(err){
//     console.error("Error in callback:", err);
//   return res.sendStatus(403);
//   }
// return res.sendStatus(403);
// });


export default router;