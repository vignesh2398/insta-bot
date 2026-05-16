export const autoReplyModule = (entries=[]) => {
  try {

    entries.forEach((entry) => {
      const changes = entry.changes || [];

      changes.forEach((change) => {
        if (change.field === "comments") {
          const value = change.value;

          // COMMENT DETAILS
          const commentId = value.id;
          const commentText = value.text;

          // USER DETAILS
          const userId = value.from?.id;
          const username = value.from?.username;

          // MEDIA DETAILS
          const mediaId = value.media?.id;

          console.log("========== COMMENT RECEIVED ==========");
          console.log("Username:", username);
          console.log("User ID:", userId);
          console.log("Comment:", commentText);
          console.log("Comment ID:", commentId);
          console.log("Media ID:", mediaId);

          // Example object
          const formattedData = {
            username,
            userId,
            comment: commentText,
            commentId,
            mediaId,
          };

          console.log(formattedData);
        }
      });
    });
  } catch (error) {

    console.log(
      error.response?.data || error.message
    );
 throw new Error(error.response?.data);    
  }
};