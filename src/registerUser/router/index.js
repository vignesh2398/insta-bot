import express from 'express';
import { getMedia, redirectUrl, validateUser } from '../controller/registerUser.js';
import { autoReply } from '../../instaCommentAutomation/controller/autoReply.js';
import { generateAccessToken, userDetails } from '../../config/acessToken.js';
import User from '../../model/user.js';
import plan from '../../constant.js';
import { getInstagramUserDetails, updateInstagramMedia } from '../../config/instagramUserDetails.js';
import {
  getAnalytics,
  getActivityStats,
  getActivityLog,
  getMessageVariants,
  saveMessageVariants,
  bulkUpdateAutomation,
  duplicateAutomation,
} from '../controller/analyticsController.js';
import { createRazorpayOrder, createSubscription } from '../../config/razorpay.js';

const router = express.Router();

/* ──────────────────────────────────────────────
   EXISTING ROUTES (unchanged)
────────────────────────────────────────────── */

router.get('/redirecturl', async (req, res, next) => {
  try {
    const result = await redirectUrl();
    res.json({ message: result });
  } catch (err) {
    next(err);
  }
});


router.post('/create-order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'insta-bot-checkout' } = req.body || {};
    const result = await createRazorpayOrder({ amount, currency, receipt });
    await createSubscription(result, req.user.id); // Assuming you have a function to create a subscription
    return res.json(result);
  } catch (error) {
    console.error('Razorpay create order error:', error);
    const status = error.statusCode || 500;
    return res.status(status).json({ error: error.message || 'Unable to create Razorpay order.' });
  }
});

router.get('/billing/pricing',async(req,res,next)=>{
  try {
    res.json({
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "tagline": "Get started with automation, no card needed.",
      "monthlyPrice": 0,
      "annualPrice": 0,
      "dmCap": "50 DMs / day",
      "dmCapClass": "free",
      "badge": { "label": "Forever free", "cls": "free-badge", "icon": "🆓" },
      "features": [
        { "text": "50 automated DMs per day", "included": true, "highlight": true },
        { "text": "1 Instagram account", "included": true },
        { "text": "Keyword trigger automation", "included": true },
        { "text": "Follow-to-DM flow", "included": false },
        { "text": "Message rotation", "included": false },
        { "text": "Priority support", "included": false }
      ],
      "cta": "Get started free",
      "ctaCls": "cta-outline",
      "featured": false
    },
    {
      "id": "starter",
      "name": "Starter",
      "tagline": "For creators growing their audience.",
      "monthlyPrice": 19,
      "annualPrice": 15,
      "dmCap": "200 DMs / day",
      "dmCapClass": "starter",
      "badge": null,
      "features": [
        { "text": "200 automated DMs per day", "included": true, "highlight": true },
        { "text": "1 Instagram account", "included": true },
        { "text": "Keyword trigger automation", "included": true },
        { "text": "Follow-to-DM flow", "included": true },
        { "text": "Message rotation", "included": false },
        { "text": "Priority support", "included": false }
      ],
      "cta": "Start Starter",
      "ctaCls": "cta-outline",
      "featured": false
    },
    {
      "id": "growth",
      "name": "Growth",
      "tagline": "For brands ready to scale engagement.",
      "monthlyPrice": 49,
      "annualPrice": 39,
      "dmCap": "500 DMs / day",
      "dmCapClass": "growth",
      "badge": { "label": "Most popular", "cls": "popular", "icon": "🔥" },
      "features": [
        { "text": "500 automated DMs per day", "included": true, "highlight": true },
        { "text": "3 Instagram accounts", "included": true },
        { "text": "Keyword trigger automation", "included": true },
        { "text": "Follow-to-DM flow", "included": true },
        { "text": "Message rotation", "included": true },
        { "text": "Priority support", "included": false }
      ],
      "cta": "Start Growth",
      "ctaCls": "cta-gradient",
      "featured": true
    },
    {
      "id": "pro",
      "name": "Pro",
      "tagline": "Unlimited power for serious businesses.",
      "monthlyPrice": 99,
      "annualPrice": 79,
      "dmCap": "Unlimited DMs",
      "dmCapClass": "pro",
      "badge": { "label": "Best value", "cls": "pro-badge", "icon": "⚡" },
      "features": [
        { "text": "Unlimited automated DMs", "included": true, "highlight": true },
        { "text": "Unlimited accounts", "included": true },
        { "text": "Keyword trigger automation", "included": true },
        { "text": "Full activity log", "included": true },
        { "text": "Follow-to-DM flow", "included": true },
        { "text": "Message rotation", "included": true },
        { "text": "Priority support", "included": true }
      ],
      "cta": "Go Pro",
      "ctaCls": "cta-outline",
      "featured": false
    }
  ],

  "faqs": [
    {
      "q": "Can I upgrade or downgrade anytime?",
      "a": "Yes — changes take effect at the start of your next billing cycle. If you upgrade mid-cycle, you'll only pay the prorated difference."
    },
    {
      "q": "What happens when I hit my daily DM cap?",
      "a": "Automation pauses for the rest of that day and resumes automatically at midnight UTC. You'll see a warning in the dashboard when you're at 80% of your limit."
    },
    {
      "q": "Do unused DMs roll over?",
      "a": "No — the cap resets daily. It's designed to keep sending patterns within Instagram's own guidelines."
    },
    {
      "q": "Is there a free trial on paid plans?",
      "a": "Starter and Growth both include a 7-day free trial, no card required. Pro requires a card upfront but can be cancelled anytime in the first 14 days for a full refund."
    },
    {
      "q": "What payment methods do you accept?",
      "a": "All major credit and debit cards via Stripe. Indian users can also pay via UPI and net banking."
    }
  ],

  "compareRows": [
    { "feature": "Daily DM limit", "free": "50", "starter": "200", "growth": "500", "pro": "Unlimited" },
    { "feature": "Instagram accounts", "free": "1", "starter": "1", "growth": "3", "pro": "Unlimited" },
    { "feature": "Keyword triggers", "free": true, "starter": true, "growth": true, "pro": true },
    { "feature": "Follow-to-DM flow", "free": false, "starter": true, "growth": true, "pro": true },
    { "feature": "Message rotation", "free": false, "starter": false, "growth": true, "pro": true },
    { "feature": "Analytics dashboard", "free": false, "starter": false, "growth": true, "pro": true },
    { "feature": "Priority support", "free": false, "starter": false, "growth": false, "pro": true }
  ]
})
  } catch (error) {
    
  }
})

router.post('/billing/checkout', async (req, res, next) => {
  try {
    const result = await createRazorpayOrder({
      amount: req.body?.amount || 100,
      currency: req.body?.currency || 'INR',
      receipt: req.body?.receipt || 'billing-checkout',
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
// check subscription status and return profile info along with subscription details
 const {subscription,instagramAccounts}=await User.findOne({ googleId: req.user.id })
    
    res.json({ profilePicture: req.user.picture, username: req.user.given_name, subscription: subscription ? subscription.planName : null,  "theme": "light",
  "dmsSentToday": instagramAccounts?.[0]?.DMCount || 0,
  "dailyCap": plan[subscription?.planName || 'free'].DMcap });
  } catch (err) {
    next(err);
  }
});

router.get('/media', async (req, res, next) => {
  try {
    const googleId = req.user.id;
    const result = await getMedia({
      googleId,
      profilePicture: req.user.picture,
      username: req.user.given_name,
      next: req.query.next,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete('/removeAccount', async (req, res, next) => {
  try {
    const googleId = req.user.id;
    const result = await User.removeInstagramAccount(googleId);
    res.json({ message: 'Instagram account removed successfully!', result });
  } catch (err) {
    next(err);
  }
});

router.get('/callback', async (req, res, next) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: 'Missing authorization code' });

    const data = await generateAccessToken(code);
    const userDetail = await userDetails(data.access_token);

    const existingUser = await User.findOne({
      'instagramAccounts.instagramId': userDetail.id,
    });
    if (existingUser) {
      throw new Error('This Instagram account is already linked to another user.');
    }

    const accountData = {
      instagramId:    userDetail.id,
      username:       userDetail.username,
      profilePicture: userDetail.profile_picture_url || '',
      id:             userDetail.id,
      userid:         userDetail.user_id,
      account_type:   userDetail.account_type,
      accessToken:    data.access_token,
      expiresIn:      data.expires_in,
    };

    await User.addInstagramAccount(req.user.id, accountData);
    res.json({ message: 'Instagram account linked successfully!' });
  } catch (err) {
    next(err);
  }
});

router.post('/automation', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found for user' });
    }
    await updateInstagramMedia({ data: req.body, instagramId: igAccount.userid });
    res.json({ message: 'Automation settings updated successfully!' });
  } catch (err) {
    next(err);
  }
});

router.get('/logout', async (req, res, next) => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully!' });
  } catch (err) {
    next(err);
  }
});

/* ──────────────────────────────────────────────
   NEW ROUTES
────────────────────────────────────────────── */

/**
 * GET /insta/analytics/:mediaId
 * Returns reach, DMs sent, conversion rate, weekly comment activity
 */
router.get('/analytics/:mediaId', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }
    const result = await getAnalytics({
      mediaId:     req.params.mediaId,
      accessToken: igAccount.accessToken,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /insta/activity/stats?mediaId=
 * Returns today's DM count, daily cap, failed count, reply delay
 */
router.get('/activity/stats', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }
    const result = await getActivityStats({
      mediaId:     req.query.mediaId,
      instagramId: igAccount.userid,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /insta/activity?mediaId=&limit=10&page=1
 * Returns paginated DM activity log for a post
 */
router.get('/activity', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }
    const result = await getActivityLog({
      mediaId:     req.query.mediaId,
      instagramId: igAccount.userid,
      limit:       parseInt(req.query.limit) || 10,
      page:        parseInt(req.query.page)  || 1,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /insta/automation/:mediaId/variants
 * Fetch message rotation variants for a post
 */
router.get('/automation/:mediaId/variants', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }
    const result = await getMessageVariants({
      mediaId:     req.params.mediaId,
      instagramId: igAccount.userid,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /insta/automation/:mediaId/variants
 * Save message rotation variants for a post
 * Body: { messages: ["msg1", "msg2"] }
 */
router.post('/automation/:mediaId/variants', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }
    const result = await saveMessageVariants({
      mediaId:     req.params.mediaId,
      instagramId: igAccount.userid,
      messages:    req.body.messages,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /insta/automation/bulk
 * Bulk enable or disable automation for multiple posts
 * Body: { mediaIds: ["id1", "id2"], enabled: true }
 */
router.post('/automation/bulk', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }
    const result = await bulkUpdateAutomation({
      mediaIds:    req.body.mediaIds,
      enabled:     req.body.enabled,
      instagramId: igAccount.userid,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /insta/automation/duplicate
 * Copy automation settings from one post to others
 * Body: { fromMediaId: "id1", toMediaIds: ["id2", "id3"] }
 */
router.post('/automation/duplicate', async (req, res, next) => {
  try {
    const igAccount = await getInstagramUserDetails(req.user.id);
    if (!igAccount) {
      return res.status(404).json({ error: 'Instagram account not found' });
    }
    const result = await duplicateAutomation({
      fromMediaId: req.body.fromMediaId,
      toMediaIds:  req.body.toMediaIds,
      instagramId: igAccount.userid,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;