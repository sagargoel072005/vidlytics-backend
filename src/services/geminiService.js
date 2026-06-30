const {
    GoogleGenerativeAI
} = require("@google/generative-ai");

const genAI =
    new GoogleGenerativeAI(
        process.env.GEMINI_API_KEY
    );

exports.compareVideos =
    async (transcript1, transcript2) => {

        const model =
            genAI.getGenerativeModel({
                model: "gemini-2.5-flash"
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

        const result =
            await model.generateContent(prompt);

        return result.response.text();
    };