// geminiService.js
const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

exports.compareVideos = async (transcript1, transcript2, retries = 3) => {
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
    });

    const prompt = `
Compare these two transcripts.

Transcript 1:
${transcript1}

Transcript 2:
${transcript2}

Return JSON:

{
"similarityScore":"",
"commonTopics":[],
"differences":[],
"summary":""
}
`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (err) {
        const isRetryable = err?.status === 503 || err?.status === 429;

        if (isRetryable && retries > 0) {
            const waitMs = err?.status === 503 ? 8000 : 60000;
            console.log(`⏳ Gemini ${err.status}. Retrying in ${waitMs / 1000}s... (${retries} left)`);
            await sleep(waitMs);
            return exports.compareVideos(transcript1, transcript2, retries - 1);
        }

        throw err;
    }
};