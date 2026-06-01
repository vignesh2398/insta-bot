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

export const updateInstagramMedia = async ({data, instagramId}) => {
    try {


const m=await Media.findOneAndUpdate(
  { mediaId: data.instagramPostId }, // search by unique mediaId
  {
    UserId: instagramId,
    keywords: (data.autoReply?.keywords ?? []).join(",").toLowerCase().split(","),
    replyAll: data.autoReply.replyAll,
    mediaId: data.instagramPostId,
    replyMessage: data.autoReply.message,
    replyStatus: data.autoReply.enabled,
  },
  {
    upsert: true, // create if not found
    returnDocument: 'after',    // return updated document
    runValidators: true,
  }
);
  
        return { success: true, message: "Instagram media updated successfully" };
    }
    catch (error) {
        console.error("Error updating Instagram media:", error);
        throw error;
    }   
}