import { autoReply, autoReplyModule } from "../module/inst_comment";

export const autoReply = async (data) => {
    try {
        const entries = data.entry || [];
        return await autoReplyModule(entries);
    } catch (err) {
        console.error("Error in autoReply:", err);
        throw new Error("Failed to process auto-reply");
        
    }
};
