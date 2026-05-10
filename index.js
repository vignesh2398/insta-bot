import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// ENV VARIABLES
const APP_ID = process.env.APP_ID;
const APP_SECRET = process.env.APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// ----------------------------------------
// 1️⃣ Login URL (redirect user)
// ----------------------------------------
app.get("/auth/login", (req, res) => {
  const url = `https://www.instagram.com/oauth/authorize
  ?client_id=1550890333064983
  &redirect_uri=http://localhost:3000/auth/login
  &response_type=code
  &scope=
    instagram_business_basic,
    instagram_business_manage_messages,
    instagram_business_manage_comments,
    instagram_business_content_publish`;

    console.log(url)
  res.redirect(url);
});

// ----------------------------------------
// 2️⃣ Callback → Get Short-Lived Token
// ----------------------------------------
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No code received");
  }

  try {
    const response = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: APP_ID,
          client_secret: APP_SECRET,
          redirect_uri: REDIRECT_URI,
          code: code,
        },
      }
    );

    const shortToken = response.data.access_token;

    res.json({
      message: "Short-lived token generated",
      shortToken,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error generating token");
  }
});

// ----------------------------------------
// 3️⃣ Convert to Long-Lived Token
// ----------------------------------------
app.get("/auth/long-token", async (req, res) => {
  const shortToken = req.query.token;

  if (!shortToken) {
    return res.status(400).send("Token missing");
  }

  try {
    const response = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: APP_ID,
          client_secret: APP_SECRET,
          fb_exchange_token: shortToken,
        },
      }
    );

    res.json({
      message: "Long-lived token generated",
      ...response.data,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error converting token");
  }
});

// ----------------------------------------
// 4️⃣ Get Facebook Pages (with Page Token)
// ----------------------------------------
app.get("/pages", async (req, res) => {
  const userToken = req.query.token;

  if (!userToken) {
    return res.status(400).send("Token missing");
  }

  try {
    const response = await axios.get(
      "https://graph.facebook.com/v19.0/me/accounts",
      {
        params: { access_token: userToken },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Error fetching pages");
  }
});

// ----------------------------------------
// 5️⃣ Webhook (for comment auto-reply)
// ----------------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];

    if (change?.field === "comments") {
      const commentId = change.value.comment_id;

      const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

      await axios.post(
        `https://graph.facebook.com/v19.0/${commentId}/replies`,
        {
          message: "🔥 Thanks for your comment!",
        },
        {
          params: { access_token: PAGE_ACCESS_TOKEN },
        }
      );
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.sendStatus(500);
  }
});

// ----------------------------------------
// 6️⃣ Webhook Verification (Meta requirement)
// ----------------------------------------
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// ----------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});