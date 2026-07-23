import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import router from "./src/registerUser/router/index.js";
import outhrouter from "./src/googleAuth/Route/index.js";
import dns from 'node:dns';
import cors from "cors";
import cookieParser from "cookie-parser";
import { getUserInfo } from "./src/config/getuserInfo.js";
import cron from 'node-cron';
import User from "./src/model/user.js";
import { userDetails } from "./src/config/acessToken.js";
import { createRazorpayOrder, verifyRazorpaySignature } from './src/config/razorpay.js';
dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config();
const app = express();
app.use("/auth/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use('/health', (req, res) => {
  console.log("helth api called")
  res.status(200).json({ status: "ok" });
});

app.get('/checkout', (req, res) => {
  const checkoutPagePath = path.join(process.cwd(), 'checkout.html');
  fs.readFile(checkoutPagePath, 'utf8', (err, file) => {
    if (err) {
      console.error('Unable to load checkout page:', err);
      return res.status(500).json({ error: 'Checkout page unavailable' });
    }

    const html = file.replace('__RAZORPAY_KEY_ID__', process.env.RAZORPAY_KEY_ID || '');
    res.send(html);
  });
});

app.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'insta-bot-checkout' } = req.body || {};
    const result = await createRazorpayOrder({ amount, currency, receipt });
    return res.json(result);
  } catch (error) {
    console.error('Razorpay create order error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Unable to create Razorpay order.' });
  }
});

app.post('/api/verify-payment', (req, res) => {
  try {
    const result = verifyRazorpaySignature(req.body || {});
    return res.json(result);
  } catch (error) {
    console.error('Razorpay verify error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, error: error.message || 'Payment verification failed.' });
  }
});
const PORT = 3000;
// write middleware for authentication and then use it here for all routes that require authentication

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }
  getUserInfo(token)
    .then((userResponse) => {
      req.user = userResponse.data; // Attach user info to request object
      next();
    })
    .catch((error) => {
      console.error("Error validating token:", error);
      res.status(401).json({ error: "Invalid token" });
    });
};
// google auth routes
app.use('/auth', outhrouter)
app.use('/insta',authMiddleware,router)
app.use((err, req, res, next) => {
  console.error("Error:", JSON.stringify(err));
  res.status(err.message.code || 500).json({ error: err.message || "Internal Server Error" });
});
app.listen(process.env.PORT, () =>{ 
  mongoose.connect(process.env.mongourl).then(()=>{
    console.log("DB connected")
  });
  console.log('Server running on port', process.env.PORT)});

//   cron.schedule('*/45 * * * * *', async () => {
//   try {
//     console.log('Running cron job every 45 sec');
//   } catch (error) {
//     console.error('Error fetching data from API:', error);
//   }
// });

