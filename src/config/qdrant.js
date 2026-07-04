
const {
    QdrantClient
} = require("@qdrant/js-client-rest");

const client =
    new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY
    });

async function createCollection() {

    try {

        await client.createCollection(
            "video_chunks",
            {
                vectors: {
                    size: 768,
                    distance: "Cosine"
                }
            }
        );

        console.log(
            "Qdrant collection created"
        );

    } catch (err) {

        console.log(
            "Collection already exists"
        );

    }

    try {

        await client.createPayloadIndex(
            "video_chunks",
            {
                field_name: "videoId",
                field_schema: "keyword"
            }
        );

        console.log(
            " videoId index created"
        );

    } catch (err) {

        console.log(
            "videoId index already exists"
        );

    }
}

module.exports = {
    client,
    createCollection
};
