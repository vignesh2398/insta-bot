import Media from '../../model/media.js';         // your existing Media model
import ActivityLog from '../../model/activitylog.js'; // new model (see below)
import axios from 'axios';

const IG_BASE = 'https://graph.instagram.com/v18.0';

/* ─── Helper: relative time string ──────────────────────────────────── */
function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─── Helper: get today's start (midnight) ───────────────────────────── */
function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ─── Helper: get date N days ago ────────────────────────────────────── */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ══════════════════════════════════════════════════════════════════════
   1. GET ANALYTICS
   GET /insta/analytics/:mediaId
   ══════════════════════════════════════════════════════════════════════ */
export async function getAnalytics({ mediaId, accessToken }) {

  const data = await Promise.allSettled([
    axios.get(`${IG_BASE}/${mediaId}`, {
      params: { metric:"reach,comments,saved", access_token: accessToken },
    }),
    Media.findOne({ mediaId }),
  ]);



  // const dmsSent   = mediaDoc.status === 'fulfilled' ? (mediaDoc.value?.dmsSent   ?? 0) : 0;
  // const dmsFailed = mediaDoc.status === 'fulfilled' ? (mediaDoc.value?.dmsFailed ?? 0) : 0;
  // const conversionRate = comments > 0 ? Math.round((dmsSent / comments) * 100) : 0;

  // Weekly activity: count ActivityLog entries per day for last 7 days


  // Activity change % vs previous week average
  // const thisWeek = weeklyActivity.reduce((a, b) => a + b, 0);
  // const prevWeekCount = await ActivityLog.countDocuments({
  //   mediaId,
  //   status: 'sent',
  //   createdAt: { $gte: daysAgo(14), $lt: daysAgo(7) },
  // });
  // const activityChange = prevWeekCount > 0
  //   ? Math.round(((thisWeek - prevWeekCount) / prevWeekCount) * 100)
  //   : 0;

  return data;
}

/* ══════════════════════════════════════════════════════════════════════
   2. GET ACTIVITY STATS
   GET /insta/activity/stats?mediaId=
   ══════════════════════════════════════════════════════════════════════ */
export async function getActivityStats({ mediaId, instagramId }) {
  const [sentToday, failedToday, mediaDoc] = await Promise.all([
    ActivityLog.countDocuments({
      mediaId,
      instagramId,
      status: 'sent',
      createdAt: { $gte: todayStart() },
    }),
    ActivityLog.countDocuments({
      mediaId,
      instagramId,
      status: 'failed',
      createdAt: { $gte: todayStart() },
    }),
    Media.findOne({ mediaId }),
  ]);

  return {
    sentToday,
    failedToday,
    dailyCap:   mediaDoc?.dailyCap   ?? 100,
    replyDelay: mediaDoc?.replyDelay ?? 0,
  };
}

/* ══════════════════════════════════════════════════════════════════════
   3. GET ACTIVITY LOG
   GET /insta/activity?mediaId=&limit=10&page=1
   ══════════════════════════════════════════════════════════════════════ */
export async function getActivityLog({ mediaId, instagramId, limit = 10, page = 1 }) {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    ActivityLog.find({ mediaId, instagramId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ActivityLog.countDocuments({ mediaId, instagramId }),
  ]);

  return {
    logs: logs.map(l => ({
      username: l.username,
      keyword:  l.keyword  || null,
      timeAgo:  timeAgo(l.createdAt),
      status:   l.status,
      error:    l.error    || null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/* ══════════════════════════════════════════════════════════════════════
   4. GET MESSAGE VARIANTS
   GET /insta/automation/:mediaId/variants
   ══════════════════════════════════════════════════════════════════════ */
export async function getMessageVariants({ mediaId, instagramId }) {
  const media = await Media.findOne({ mediaId, UserId: instagramId });
  if (!media) {
    return { messages: [] };
  }
  return { messages: media.messageVariants || [] };
}

/* ══════════════════════════════════════════════════════════════════════
   5. SAVE MESSAGE VARIANTS
   POST /insta/automation/:mediaId/variants
   Body: { messages: ["msg1", "msg2"] }
   ══════════════════════════════════════════════════════════════════════ */
export async function saveMessageVariants({ mediaId, instagramId, messages }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }

  const cleaned = messages
    .map(m => (typeof m === 'string' ? m.trim() : ''))
    .filter(Boolean)
    .slice(0, 3); // max 3 variants

  await Media.findOneAndUpdate(
    { mediaId, UserId: instagramId },
    { messageVariants: cleaned },
    { upsert: true, new: true }
  );

  return { success: true, saved: cleaned.length };
}

/* ══════════════════════════════════════════════════════════════════════
   6. BULK UPDATE AUTOMATION
   POST /insta/automation/bulk
   Body: { mediaIds: ["id1","id2"], enabled: true }
   ══════════════════════════════════════════════════════════════════════ */
export async function bulkUpdateAutomation({ mediaIds, enabled, instagramId }) {
  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    throw new Error('mediaIds must be a non-empty array');
  }

  const result = await Media.updateMany(
    { mediaId: { $in: mediaIds }, UserId: instagramId },
    { replyStatus: Boolean(enabled) }
  );

  return { updated: result.modifiedCount };
}

/* ══════════════════════════════════════════════════════════════════════
   7. DUPLICATE AUTOMATION SETTINGS
   POST /insta/automation/duplicate
   Body: { fromMediaId: "id1", toMediaIds: ["id2","id3"] }
   ══════════════════════════════════════════════════════════════════════ */
export async function duplicateAutomation({ fromMediaId, toMediaIds, instagramId }) {
  if (!fromMediaId) throw new Error('fromMediaId is required');
  if (!Array.isArray(toMediaIds) || toMediaIds.length === 0) {
    throw new Error('toMediaIds must be a non-empty array');
  }

  // Fetch source settings
  const source = await Media.findOne({ mediaId: fromMediaId, UserId: instagramId }).lean();
  if (!source) throw new Error('Source post not found');

  // Fields to copy across
  const fieldsToCopy = {
    replyStatus:        source.replyStatus,
    replyAll:           source.replyAll,
    keywords:           source.keywords,
    replyMessage:       source.replyMessage,
    oneDmPerUser:       source.oneDmPerUser,
    excludeFollowers:   source.excludeFollowers,
    rotateMessages:     source.rotateMessages,
    personalizeMessage: source.personalizeMessage,
    messageVariants:    source.messageVariants,
  };

  // Upsert each target — only copy automation fields, keep their own mediaId/UserId
  const ops = toMediaIds.map(mediaId =>
    Media.findOneAndUpdate(
      { mediaId, UserId: instagramId },
      { $set: fieldsToCopy },
      { upsert: true, new: true }
    )
  );

  const results = await Promise.allSettled(ops);
  const copied = results.filter(r => r.status === 'fulfilled').length;

  return { copied };
}