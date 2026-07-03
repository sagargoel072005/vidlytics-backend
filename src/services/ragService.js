const {
  client: qdrantClient
} = require("../config/qdrant");


const COLLECTION =
"video_chunks";

async function searchChunks(
 videoId,
 questionEmbedding
){
console.log(typeof questionEmbedding);
console.log(questionEmbedding?.length);
console.log(questionEmbedding);
 const result =
 await qdrantClient.search(
  COLLECTION,
  {
   vector:questionEmbedding,

   limit:5,

  //  filter:{
  //   must:[
  //    {
  //     key:"videoId",
  //     match:{
  //      value:videoId
  //     }
  //    }
  //   ]
  //  }
  }
 );

 return result;
}



module.exports = {
 searchChunks
};