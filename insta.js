import axios from "axios";

const ACCESS_TOKEN = "IGAAVOScgItZCVBZAGFDTzBWV0szWjFtZAFZAjSHpEVUJ5VVBvNGRSX1IwZAXpnemplWEhnWlBoY3FkbDZAPdzNQQUpDOW12dnI3ZAHBRM2pjZA2ZA3ZA21QbXZAsOGlWTEFWWGxTd1lERUtTdzFhaHE1RjNyUUVDLXA3ZAUNVYVE2dDZADYTREbwZDZD"
// Instagram User ID of your business account
const IG_BUSINESS_ID = "17841404523399967";

// Instagram Scoped User ID (recipient)
const RECIPIENT_ID = "1515086890001324";





const APP_ID = "1493453679146997";
const APP_SECRET = "d3af481346a71d1460e4127d3026a183";
const REDIRECT_URI = "https://insta-bot-hapj.onrender.com/auth/callback";

// code from query param
const CODE = "AQJfaxzb88FZrkO5zn522Co0UdHr8hlItu_x-koLVOHzAGZbL2VctyTfBAD3bzd2yf21F38m0tBxbK8GsKYhJqc5_pkk75tSKpOW9ke4_Hkh-Gt0riGxac8-YyM61eH6ZNkVKRZwr__pLSDJMi6hZRWBsSI6hDnnD4Oay8edUq4yJW8MZLL8oNMRd4feVyS4dcD3FWM1rcheO9upfr4FCwciaSyJYIsCllFQFOer6nGkzQ#_";

async function getAccessToken() {
  try {

    const response = await axios.get(
      "https://api.instagram.com/oauth/access_token",
      {
        params: {
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: CODE,
        },
      }
    );

    console.log("Access Token:");
    console.log(response.data);

  } catch (error) {

    console.error(
      error.response?.data || error.message
    );
  }
}

// getAccessToken();



// checkToken();

// sendInstagramMessage();

// const axios = require("axios");

// const ACCESS_TOKEN = "YOUR_ACCESS_TOKEN";

async function checkTokenExpiry() {
           await axios.post(
              `https://graph.instagram.com/v22.0/17841449758546166/messages`,
              {
                recipient: {
                  comment_id: '1338062018176406'
                },

                message: {
                  text:
                    "Here is your guide 🚀"
                }
              },
              {
                headers: {
                  Authorization:
                    `Bearer ${ACCESS_TOKEN}`,
                  "Content-Type":
                    "application/json",
                },
              }
            );

            console.log(
              "Private DM sent"
            );
}

checkTokenExpiry();