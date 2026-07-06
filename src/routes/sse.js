const express =require("express");
const sseRouter = express.Router();

const {addClient, removeClient}= require("../utils/sseManager");

sseRouter.get( "/:jobId/progress",(req, res) => {

        res.setHeader(
            "Content-Type",
            "text/event-stream"
        );

        res.setHeader(
            "Cache-Control",
            "no-cache"
        );

        const { jobId } =
            req.params;

        addClient(
            jobId,
            res
        );

        req.on(
            "close",
            () => {
                removeClient(jobId);
            }
        );

    });
    
// const { sendProgress } =
// require("../utils/sseManager");

// sseRouter.get(
//   "/trigger/:jobId",
//   (req,res)=>{

//     sendProgress(
//       req.params.jobId,
//       {
//         progress:50,
//         message:"Testing"
//       }
//     );
//      sendProgress(
//       req.params.jobId,
//       {
//         progress:100,
//         message:"Testing 3"
//       }
//     );

//     res.json({
//       success:true
//     });

//   }
// );

module.exports = sseRouter;


