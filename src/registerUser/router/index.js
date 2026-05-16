import express from 'express';
import { redirectUrl, validateUser } from '../controller/registerUser.js';
const router = express.Router();

router.get('/redirecturl', async (req,res,next) => {
  try {
const result=await redirectUrl()
res.json({message:result});
  } catch (err) {
    next(err);
  }
});

router.get('/auth/callback', async (req,res,next) => {
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
export default router;