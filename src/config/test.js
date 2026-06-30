require("dotenv").config({
 path:"../../.env"
});
const { client } = require("./qdrant");

async function testQdrant() {

    try {

        const collections =
            await client.getCollections();

        console.log(collections);

    } catch (err) {

        console.error(err);

    }

}

testQdrant();