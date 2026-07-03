const { GoogleGenAI } = require("@google/genai");

const {
  client: qdrantClient
}
=
require("../config/qdrant");

const { v4: uuidv4 } =
    require("uuid");

const COLLECTION =
    "video_chunks";

const genAI =
    new GoogleGenAI(
        process.env.GEMINI_API_KEY
    );

function chunkText(
    text,
    chunkSize = 1000
) {

    const chunks = [];

    for (
        let i = 0;
        i < text.length;
        i += chunkSize
    ) {
        chunks.push(
            text.slice(
                i,
                i + chunkSize
            )
        );
    }

    return chunks;
}

async function getEmbedding(text) {

  const response =
    await genAI.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
    });

  return response.embeddings[0].values;
}

async function saveTranscriptToQdrant(
    videoId,
    transcript
) {

    const chunks =
        chunkText(transcript);
            console.log(
      "Chunks:",
      chunks.length
    );

    const points = [];

    for (
        let i = 0;
        i < chunks.length;
        i++
    ) {

        const embedding =
            await getEmbedding(
                chunks[i]
            );

        points.push({

            id: uuidv4(),

            vector: embedding,

            payload: {
                videoId,
                text: chunks[i],
                chunkIndex: i
            }

        });
    }

        console.log(
      "Points:",
      points.length
    );

    console.log(
      "Uploading to Qdrant..."
    );


    await qdrantClient.upsert(
        COLLECTION,
        {
            wait: true,
            points
        }
    );

    return true;
}

module.exports = {
    saveTranscriptToQdrant,
    getEmbedding
};