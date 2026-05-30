import { autoReplyModule } from "../module/inst_comment.js";
export const autoReply = async (data) => {
    try {
        console.log("Auto-reply data:", typeof data, "dataaa");
        const entries = data.entry || [];
        return await autoReplyModule(entries);
    } catch (err) {
        console.error("Error in autoReply:", err,"sd");
        throw new Error("Failed to process auto-reply");
        
    }
};
