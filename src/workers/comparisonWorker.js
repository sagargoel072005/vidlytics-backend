const { Worker } = require("bullmq");
const redis = require("../config/redis");
const Comparison = require("../models/Comparision");
const { getTranscript } = require("../services/transcriptService");
const { compareVideos } = require("../services/geminiService");
const { sendProgress } = require("../utils/sseManager");
const { saveTranscriptToQdrant } = require("../services/embeddingService");

new Worker(

    "comparisonQueue",

    async job => {

        const {
            userId,
            video1,
            video2
        }
            =
            job.data;

        sendProgress(
            job.id,
            {
                progress: 10,
                message: "Transcript 1",
            
            }
        );

        const transcript1 =
            await getTranscript(video1);

        sendProgress(
            job.id,
            {
                progress: 30,
                message: "Transcript 2"
            }
        );

        const transcript2 =
            await getTranscript(video2);

        sendProgress(
            job.id,
            {
                progress: 60,
                message: "vidlytics Analysis"
            }
        );

        const comparison =
            await Comparison.create({

                userId,

                video1,
                video2,

                transcript1,
                transcript2,

                aiResult: null

            });
        // console.log(
        //     "Saving transcript to Qdrant..."
        // );
        await saveTranscriptToQdrant(
            comparison._id.toString(),
            transcript1
        );

        await saveTranscriptToQdrant(
            comparison._id.toString(),
            transcript2
        );
        // console.log(
        //     "Qdrant save complete"
        // );

        const result =
            await compareVideos(
                transcript1,
                transcript2
            );
        comparison.aiResult = result;

        await comparison.save();


        sendProgress(
            job.id,
            {
                progress: 100,
                message: "Completed",
                comparisonId: comparison._id
            }
        );

        return result;

    },

    {
        connection: redis
    }

);