import express from 'express';
import { getMedia, redirectUrl, validateUser } from '../controller/registerUser.js';
import { autoReply } from '../../instaCommentAutomation/controller/autoReply.js';
import { generateAccessToken, userDetails } from '../../config/acessToken.js';
import User from '../../model/user.js';
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

router.get('/profile', async (req, res, next) => {
  try {
    res.json({ profilePicture: req.user.picture, username: req.user.given_name });
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