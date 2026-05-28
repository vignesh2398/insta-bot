import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./src/registerUser/router/index.js";
dotenv.config();

const app = express();
app.use(express.json());
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = 3000;
app.use('/',router)

app.listen(process.env.PORT, () =>{ 
  mongoose.connect(process.env.mongourl).then(()=>{
    console.log("DB connected")
  });
  console.log('Server running on port', process.env.PORT)});

