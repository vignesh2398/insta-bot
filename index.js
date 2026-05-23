import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./src/registerUser/router/index.js";
import outhrouter from "./src/googleAuth/Route/index.js";

// import  { run } from "./src/config/db.js";
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
app.use('/',router)

// google auth routes
app.use('/auth', outhrouter)
// write middleware for authentication and then use it here for all routes that require authentication
// app.use('/auth',router)
app.listen(process.env.PORT, () =>{ 
  mongoose.connect(process.env.mongourl).then(()=>{
    console.log("DB connected")
  });
  console.log('Server running on port', process.env.PORT)});

