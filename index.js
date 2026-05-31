import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./src/registerUser/router/index.js";
import outhrouter from "./src/googleAuth/Route/index.js";
import dns from 'node:dns';
import cors from "cors";
import cookieParser from "cookie-parser";
import { getUserInfo } from "./src/config/getuserInfo.js";
import cron from 'node-cron';
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
  res.status(200).json({ status: "ok" });
});



const PORT = 3000;

// google auth routes
app.use('/auth', outhrouter)
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



app.use('/insta',authMiddleware,router)
app.listen(process.env.PORT, () =>{ 
  mongoose.connect(process.env.mongourl).then(()=>{
    console.log("DB connected")
  });
  console.log('Server running on port', process.env.PORT)});

  cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('Running cron job every 5 minutes');
  } catch (error) {
    console.error('Error fetching data from API:', error);
  }
});

