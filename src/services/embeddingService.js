const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

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
    new GoogleGenerativeAI(
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

async function getEmbedding(
    text
) {

    const model =
        genAI.getGenerativeModel({
            model:
                "text-embedding-004"
        });

    const result =
        await model.embedContent(
            text
        );

    return result.embedding.values;
}

async function saveTranscriptToQdrant(
    videoId,
    transcript
) {

    const chunks =
        chunkText(transcript);

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