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
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");

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
    

module.exports = sseRouter;


