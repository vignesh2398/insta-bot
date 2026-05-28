import express from 'express';
import { autoReply } from '../controller/autoReply';
const router = express.Router();

router.get('/callback', async (req,res,next) => {
  try {
const result = await autoReply(req.body)
res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/callback", (req, res) => {
    try {
  console.log("WEBHOOK EVENT:");
  console.log(JSON.stringify(req.body, null, 2));
  autoReply(req.body);

  res.sendStatus(200);
    }catch(err){
        console.error("Error in callback:", err);
        return res.sendStatus(403);
    }

});
router.get("/media", (req, res) => {
    try {
      
        // Handle media request
    } catch (err) {
        console.error("Error in media request:", err);
        return res.sendStatus(403);
    }
});




export default router;