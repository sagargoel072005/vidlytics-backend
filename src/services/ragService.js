const {
  client: qdrantClient
} = require("../config/qdrant");


const COLLECTION =
  "video_chunks";

async function searchChunks(
  videoId,
  questionEmbedding
) {
  try {

    const result =
      await qdrantClient.search(
        COLLECTION,
        {
          vector: questionEmbedding,
          limit: 5,
          filter: {
            must: [
              {
                key: "videoId",
                match: {
                  value: videoId
                }
              }
            ]
          }
        }
      );

    return result;

  } catch (err) {

    console.log(
      "FULL ERROR =>",
      err
    );

    console.log(
      "ERROR JSON =>",
      JSON.stringify(err, null, 2)
    );

    throw err;
  }
}

module.exports = {
  searchChunks
};