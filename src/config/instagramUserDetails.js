import Media from "../model/media.js";
import User from "../model/user.js";

export const getInstagramUserDetails = async (id) => {
console.log("Fetching Instagram user details for Google ID:", id);
    try {

      const igAccount = await User.findOne({ "googleId": id }, { instagramAccounts: 1, _id: 0 })
        if(igAccount && igAccount.instagramAccounts && igAccount.instagramAccounts.length > 0)
        {
            return igAccount.instagramAccounts[0];
        }
            else {
                throw new Error(`No Instagram accounts found for user ${id}`);
            }

     
    }
    catch (error) {
        console.error("Error fetching Instagram user details:", error);
        throw error;
    }
}

export const updateInstagramMedia = async ({ data, instagramId }) => {
  try {
    const autoReply = data?.autoReply ?? {};

    const mediaDoc = await Media.findOneAndUpdate(
      { mediaId: data?.instagramPostId },
      {
        UserId: instagramId,
        keywords: (autoReply.keywords ?? []).map((k) => String(k).trim().toLowerCase()),
        replyAll: Boolean(autoReply.replyAll),
        mediaId: data?.instagramPostId,
        oneDmPerUser: Boolean(autoReply.oneDmPerUser),
        excludeFollowers: Boolean(autoReply.followToDm ?? false),
        replyMessage: autoReply.message ?? "",
        rotateMessages: Boolean(autoReply.rotateMessages),
        personalizeMessage: Boolean(autoReply.personalizeMessage),
        replyStatus: Boolean(autoReply.enabled),
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return { success: true, message: "Instagram media updated successfully", mediaDoc };
  } catch (error) {
    console.error("Error updating Instagram media:", error);
    throw new Error("Failed to update Instagram media");
  }
};