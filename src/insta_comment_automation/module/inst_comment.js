export const autoReplyModule = (entries=[]) => {
  try {
    for (const entry of entries) {

      const changes = entry.changes || [];

      for (const change of changes) {

        // Only comments webhook
        if (change.field === "comments") {

          const commentId =
            change.value.id;

          const commentText =
            change.value.text;

          const username =
            change.value.from.username;

          const userId =
            change.value.from.id;

          console.log({
            commentId,
            commentText,
            username,
            userId,
          });

          // Check comment text
          if (
            commentText &&
            commentText.toLowerCase() === "help"
          ) {

            // -----------------------------------
            // 1. PUBLIC COMMENT REPLY
            // -----------------------------------

            await axios.post(
              `https://graph.facebook.com/v22.0/${commentId}/replies`,
              {
                message:
                  `@${username} check your DM 🚀`
              },
              {
                params: {
                  access_token: ACCESS_TOKEN
                }
              }
            );

            console.log("Comment reply sent");

            // -----------------------------------
            // 2. PRIVATE DM / PRIVATE REPLY
            // -----------------------------------

            await axios.post(
              `https://graph.facebook.com/v22.0/${commentId}/private_replies`,
              {
                message:
                  "Here is your guide 🚀"
              },
              {
                params: {
                  access_token: ACCESS_TOKEN
                }
              }
            );

            console.log("Private DM sent");
          }
        }
      }
    }
  } catch (error) {

    console.log(
      error.response?.data || error.message
    );
 throw new Error(error.response?.data);    
  }
};