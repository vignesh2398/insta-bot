import axios from "axios";

export const getUserMedia = async ({accessToken, igUserId,nextPageToken}) => {
  try {
    const response = await axios.get(
      `https://graph.instagram.com/${igUserId}/media`,
      {
        params: {
          fields:
            "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,comments_count",
          access_token: accessToken,
          after: nextPageToken || undefined,
        },
      }
    );

    const mediaItems = response.data?.data || [];
    const nextPage = response.data?.paging?.cursors?.after || null;
    const posts = mediaItems.map((item) => {
      const timestamp = item.timestamp ? new Date(item.timestamp) : null;
      const ageMs = timestamp ? Date.now() - timestamp.getTime() : 0;
      const daysAgo = timestamp
        ? `${Math.floor(ageMs / (1000 * 60 * 60 * 24))}d ago`
        : "unknown";

      const caption = item.caption || "";
      const image =  item.thumbnail_url || item.media_url ||"";
      const comments = item.comments_count ?? 0;

      return {
        id: item.id,
        image,
        mediaType: item.media_type,
        permalink: item.permalink,
        username: item.username,
        timestamp: item.timestamp,
        
        daysAgo,
        caption,
        comments,
        enabled: true,
        replyAll: true,
        keywords: [],
        message: "",
        charCount: caption.length,
        oldPost: ageMs > 7 * 24 * 60 * 60 * 1000,
      };
    });

    return { posts ,nextPageToken: nextPage };
  } catch (error) {
    console.error(
      "Error fetching Instagram media:",
      error.response?.data || error.message
    );
    throw new Error("Failed to fetch Instagram media");
  }
};
