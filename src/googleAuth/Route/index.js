import { generateGoogleAuthUrl } from "../controller/oauthurl.js";
import express from 'express';
const outhrouter = express.Router();
outhrouter.get("/redirectUrl",async (req, res,next) => {
    try {
        const authUrl = generateGoogleAuthUrl();
        res.json({ message: authUrl });
    }catch(err){
        console.error("Error in callback:", err);
        next(err);
    }

});

outhrouter.get("/callback", async (req, res,next) => {
    try {
        const code = req.query.code;
        // Here you would typically exchange the code for an access token
        // and validate the user. This is a placeholder for demonstration.
        res.json({ message: "User validated successfully!" });
    }catch(err){
        console.error("Error in callback:", err);
        next(err);
    }

});


export default outhrouter;