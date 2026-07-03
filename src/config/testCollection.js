require("dotenv").config({
  path: "../../.env"
});

console.log(process.env.QDRANT_URL);
console.log(process.env.QDRANT_API_KEY);

const {
  client: qdrantClient
} = require("./qdrant");

async function test() {

  const info =
    await qdrantClient.getCollection(
      "video_chunks"
    );

  console.log(info);
  console.log(
 info.config.params.vectors
);
}

test();


// require("dotenv").config({
//   path: "../../.env"
// });

// const {
//   client
// } = require("./qdrant");

// async function run() {

//   await client.createCollection(
//     "video_chunks",
//     {
//       vectors: {
//         size: 3072,
//         distance: "Cosine"
//       }
//     }
//   );

//   console.log(
//     "Collection Created"
//   );
// }

// run();