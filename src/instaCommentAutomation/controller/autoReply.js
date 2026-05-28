import { autoReplyModule } from "../module/inst_comment.js";
export const autoReply = async (data) => {
    try {
        const entries = data.entry || [];
        if (!entries.length) {
            console.warn("autoReply called with empty entries", { body: data });
        }
        return await autoReplyModule(entries);
    } catch (err) {
        console.error("Error in autoReply", {
            body: data,
            error: err.message || err,
            stack: err.stack,
        });
        throw new Error("Failed to process auto-reply");
    }
};
