import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./src/registerUser/router/index.js";
import outhrouter from "./src/googleAuth/Route/index.js";
import dns from 'node:dns';
import cors from "cors";
import { getUserInfo } from "./src/config/getuserInfo.js";
dns.setServers(['1.1.1.1', '8.8.8.8']);

dotenv.config();
const app = express();
app.use(
  cors({
    origin:[ "http://localhost:5173", "https://accounts.google.com" ], // React frontend URL
    credentials: true,
  })
);
app.use(express.json());

const PORT = 3000;
// instagram routes
// app.use('/',router)
// google auth routes
app.use('/auth', outhrouter)
// write middleware for authentication and then use it here for all routes that require authentication

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Auth Header:", authHeader);
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
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

} 
app.use('/insta',authMiddleware,router)
app.listen(process.env.PORT, () =>{ 
  mongoose.connect(process.env.mongourl).then(()=>{
    console.log("DB connected")
  });
  console.log('Server running on port', process.env.PORT)});

