const Chat = require("../models/Chat");
const {searchChunks} = require("../services/ragService");
const { getEmbedding} = require("../services/embeddingService");
const { GoogleGenAI } =
require("@google/genai");

const ai =
new GoogleGenAI({
  apiKey:
  process.env.GEMINI_API_KEY
});
exports.askQuestion =async (req, res) => { 
    const {videoId,question } =  req.body;

        const history =
            await Chat.find({
                videoId,
                userId: req.user.id
            })
                .sort({ createdAt: -1 })
                .limit(10);

        const questionEmbedding =
            await getEmbedding(question);

        const chunks =
            await searchChunks(
                videoId,
                questionEmbedding
            );
console.log(
 JSON.stringify(
   chunks,
   null,
   2
 )
);
        const context =
            chunks
                .map(c => c.payload.text)
                .join("\n");

        const chatHistory =
            history
                .reverse()
                .map(
                    m =>
                        `${m.role}: ${m.content}`
                )
                .join("\n");

        const prompt = `

Context:
${context}

Previous Conversation:
${chatHistory}

Question:
${question}

Answer using only context.

`;

      const result =
await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: prompt
});

const answer =
result.text;

        await Chat.create({
            userId: req.user.id,
            videoId,
            role: "user",
            content: question
        });

        await Chat.create({
            userId: req.user.id,
            videoId,
            role: "assistant",
            content: answer
        });

        res.json({
            success: true,
            answer
        });

    };

exports.getChatHistory =
    async (req, res) => {

        const history =
            await Chat.find({
                videoId: req.params.videoId,
                userId: req.user.id
            })
                .sort({
                    createdAt: 1
                });

        res.json({
            success: true,
            history
        });

    };