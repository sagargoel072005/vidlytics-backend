
const client = require("../config/qdrant")
const COLLECTION =
    "video_chunks";

async function createCollection() {

    try {

        await client.createCollection(
            COLLECTION,
            {
                vectors: {
                    size: 768,
                    distance: "Cosine"
                }
            });

    } catch (err) { }
}

module.exports = {
    client,
    createCollection,
    COLLECTION
};