import { sendInstagramMessage } from "../../config/privateReply.js";
import ActivityLog from "../../model/activitylog.js";
import Media from "../../model/media.js";


export const getToken= async () => {
  try {
    await User.findOne({ UserId: process.env.INSTAGRAM_USER_ID }).then((user) => {
      if (user) {
        console.log("User found:", user);
        return user.accessToken;
      } else {
        console.log("User not found");
        return null;
      }
    });
  } catch (err) {
    console.error("Error fetching token:", err);
    return null;
  }
};





/* ─────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────── */

/**
 * Replace {name}, {username}, {keyword} tokens in a message string.
 * e.g. "Hey {name}!" + { name: "Rahul" } → "Hey Rahul!"
 */
function personalizeMessage(template, { name = '', username = '', keyword = '' }) {
  return template
    .replace(/\{name\}/gi,     name     || username || 'there')
    .replace(/\{username\}/gi, username || name     || 'there')
    .replace(/\{keyword\}/gi,  keyword  || '');
}

/**
 * Pick the next message variant in round-robin order.
 * Uses dmsSent as a counter so each post rotates independently.
 * Falls back to replyMessage if variants array is empty.
 */
function pickVariant(mediaDoc) {
  const variants = (mediaDoc.messageVariants || []).filter(Boolean);
  if (!variants.length) return mediaDoc.replyMessage || '';
  const index = (mediaDoc.dmsSent || 0) % variants.length;
  return variants[index];
}

/**
 * Write one ActivityLog entry. Never throws — failure to log
 * must not block the DM send result.
 */
async function logActivity({ mediaId, instagramId, username, userId, keyword, commentId, status, error }) {
  try {
    await ActivityLog.create({
      mediaId,
      instagramId,
      username,
      userId,
      keyword:   keyword   || null,
      commentId: commentId || null,
      status,
      error:     error     || null,
    });
  } catch (logErr) {
    console.error('[ActivityLog] Failed to write log entry:', logErr.message);
  }
}

/**
 * Check whether this user has already received a DM for this post.
 * Used by the oneDmPerUser smart control.
 */
async function hasAlreadyReceivedDm(mediaId, userId) {
  const count = await ActivityLog.countDocuments({
    mediaId,
    userId,
    status: 'sent',
  });
  return count > 0;
}

/**
 * Normalise comment text into an array of lowercase words for keyword matching.
 */
function tokenize(text = '') {
  return text.toLowerCase().match(/\w+/g) || [];
}

/**
 * Find which keyword (if any) from the media doc triggered this comment.
 * Returns the matched keyword string or null if replyAll.
 */
function findMatchedKeyword(commentText, keywords = []) {
  const words = tokenize(commentText);
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase().trim();
    if (words.includes(kwLower)) return kwLower;
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────
   MAIN MODULE
───────────────────────────────────────────────────────────────────── */

export const autoReplyModule = async (entries = []) => {
  try {
    console.log('[autoReplyModule] called with entries:', entries.length);

    if (!Array.isArray(entries) || entries.length === 0) {
      console.log('[autoReplyModule] No entries to process');
      return;
    }

    const igId = entries[0]?.id;
    const sendTasks = [];

    for (const entry of entries) {
      const changes = entry?.changes || [];

      for (const change of changes) {
        // Only handle comment webhooks
        if (change.field !== 'comments') continue;

        const value = change.value || {};
        console.log('[autoReplyModule] Processing comment change:', value);

        // Skip reply-comments (replies to other comments)
        if (value?.parent_id) {
          console.log('[autoReplyModule] Skipping reply comment:', value.id);
          continue;
        }

        const commentId   = value.id;
        const commentText = value.text || '';
        const userId      = value.from?.id;
        const username    = value.from?.username || '';
        const mediaId     = value.media?.id;

        if (!commentId || !commentText || !userId || !mediaId) {
          console.warn('[autoReplyModule] Skipping incomplete comment payload', {
            commentId, commentText, userId, mediaId,
          });
          continue;
        }

        // ── Query matching media docs ──────────────────────────────
        // Fix: split words properly and use $in correctly
        const commentWords = tokenize(commentText);

        const mediaDataList = await Media.find({
          mediaId,
          replyStatus: true,
          $or: [
            { replyAll: true },
            { keywords: { $in: commentWords } },
          ],
        });

        if (!mediaDataList.length) {
          console.log('[autoReplyModule] No matching media for comment:', commentText);
          continue;
        }

        // ── Process each matching media doc ────────────────────────
        for (const mediaDoc of mediaDataList) {

          // Find which keyword triggered this (null = replyAll)
          const matchedKeyword = mediaDoc.replyAll
            ? null
            : findMatchedKeyword(commentText, mediaDoc.keywords);

          // ── Smart control: oneDmPerUser ──────────────────────────
          if (mediaDoc.oneDmPerUser) {
            const alreadySent = await hasAlreadyReceivedDm(mediaId, userId);
            if (alreadySent) {
              console.log(`[autoReplyModule] Skipping — already sent DM to user ${userId} for post ${mediaId}`);
              continue;
            }
          }

          // ── Smart control: excludeFollowers ──────────────────────
          // NOTE: Follower check requires your own followers list in DB.
          // If you store followers, query here. Skipping for now unless implemented.
          // if (mediaDoc.excludeFollowers) {
          //   const isFollower = await checkIsFollower(igId, userId);
          //   if (isFollower) continue;
          // }

          // ── Pick message (variant rotation or single) ────────────
          let messageTemplate = mediaDoc.rotateMessages
            ? pickVariant(mediaDoc)
            : (mediaDoc.replyMessage || '');

          if (!messageTemplate) {
            console.warn('[autoReplyModule] Empty message template for mediaId:', mediaId);
            continue;
          }

          // ── Smart control: personalizeMessage ────────────────────
          const finalMessage = mediaDoc.personalizeMessage
            ? personalizeMessage(messageTemplate, {
                name:     username,
                username: username,
                keyword:  matchedKeyword || '',
              })
            : messageTemplate;

          // ── Build send payload ───────────────────────────────────
          const sendPayload = {
            username,
            userId,
            comment:     commentText,
            commentId,
            mediaId,
            recipientId: userId,
            replyMessage: finalMessage,
            igId,
          };

          // ── Push send task ────────────────────────────────────────
          sendTasks.push(
            sendInstagramMessage(sendPayload)
              .then(async () => {
                console.log(`[autoReplyModule] DM sent to ${username} (${userId})`);

                // Log success
                await logActivity({
                  mediaId,
                  instagramId: igId,
                  username,
                  userId,
                  keyword:   matchedKeyword,
                  commentId,
                  status:    'sent',
                });

                // Increment dmsSent counter on Media doc
                await Media.findOneAndUpdate(
                  { mediaId },
                  { $inc: { dmsSent: 1 } }
                );
              })
              .catch(async (err) => {
                const errMsg = err.response?.data
                  ? JSON.stringify(err.response.data)
                  : err.message || String(err);

                console.error('[autoReplyModule] sendInstagramMessage failed:', {
                  commentId, mediaId, userId,
                  error: errMsg,
                });

                // Log failure
                await logActivity({
                  mediaId,
                  instagramId: igId,
                  username,
                  userId,
                  keyword:   matchedKeyword,
                  commentId,
                  status:    'failed',
                  error:     errMsg,
                });

                // Increment dmsFailed counter on Media doc
                await Media.findOneAndUpdate(
                  { mediaId },
                  { $inc: { dmsFailed: 1 } }
                );
              })
          );
        }
      }
    }

    if (sendTasks.length > 0) {
      console.log(`[autoReplyModule] Running ${sendTasks.length} send tasks`);
      await Promise.allSettled(sendTasks);
    } else {
      console.log('[autoReplyModule] No send tasks to run');
    }

  } catch (error) {
    console.error('[autoReplyModule] Unhandled error:', {
      entriesCount: Array.isArray(entries) ? entries.length : 0,
      error: error.response?.data || error.message || error,
      stack: error.stack,
    });
    throw new Error(error.response?.data || error.message || 'autoReplyModule failed');
  }
};

// export const autoReplyModule = async (entries = []) => {
//   try {
//     console.log("autoReplyModule called with entries:", entries);
//     if (!Array.isArray(entries) || entries.length === 0) {
//       console.log("No entries to process");
//       return;
//     }

//     const sendTasks = [];
//     const igId=entries[0].id
//   // console.log("idddd",entries[0].id,"iddd")
//     for (const entry of entries) {
//       const changes = entry?.changes || [];
//       for (const change of changes) {
//         if (change.field !== "comments") {
//           continue;
//         }

//         const value = change.value || {};
//         console.log("Processing comment change:",value)
//         if(value?.parent_id){
//           console.log("Skipping reply comment:", value.id);
//           continue;
//         }
//         const commentId = value.id;
//         const commentText = value.text;
//         const userId = value.from?.id;
//         const username = value.from?.username;
//         const mediaId = value.media?.id;

//         if (!commentId || !commentText || !userId || !mediaId) {
//           console.warn("Skipping incomplete comment payload", {
//             commentId,
//             commentText,
//             userId,
//             mediaId,
//             changeValue: value,
//           });
//           continue;
//         }


// const mediaData = await Media.find({
//   mediaId,
//   replyStatus: true,
//   $or: [
//     { keywords: { $in: commentText.split(" ").trim().toLowerCase() } },
//     { replyAll: true }
//   ]
// });

//         if (!mediaData.length) {
//           console.log("No matching media found for comment:", commentText);
//           continue;
//         }


//           const formattedData = {
//           username,
//           userId,
//           comment: commentText,
//           commentId,
//           mediaId,
//           recipientId: userId,
//         };
//         for (const data of mediaData) {
//           sendTasks.push(
//             sendInstagramMessage({
//               ...formattedData,
//               replyMessage: data.replyMessage,igId
//             }).catch((err) => {
//               console.error("sendInstagramMessage failed for comment", {
//                 commentId,
//                 mediaId,
//                 userId,
//                 replyMessage: data.replyMessage,
//                 error: err.response?.data || err.message || err,
//                 stack: err.stack,
//               });
//             })
//           );
//         }
//       }
//     }

//     if (sendTasks.length) {
//       await Promise.allSettled(sendTasks);
//     }
//   } catch (error) {
//     console.log("Error in autoReplyModule", {
//       entriesCount: Array.isArray(entries) ? entries.length : 0,
//       error: error.response?.data || error.message || error,
//       stack: error.stack,
//     });
//     throw new Error(error.response?.data || error.message || "autoReplyModule failed");
//   }
// };