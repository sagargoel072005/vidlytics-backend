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

// ── Add this to the existing geminiService.js, below exports.compareVideos ──

exports.generateStudyMaterial = async (transcript, retries = 3) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
You are creating study material from a lecture/video transcript.

Transcript:
${transcript}

Return ONLY valid JSON in exactly this shape (no markdown, no commentary):

{
  "notes": {
    "summary": "2-3 sentence overview of the whole video",
    "sections": [
      { "heading": "Topic name", "points": ["key point 1", "key point 2"] }
    ]
  },
  "quiz": [
    {
      "question": "A clear question testing understanding of a key concept",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "One sentence explaining why this is correct"
    }
  ],
  "mermaidFlowchart": "flowchart TD\\n  A[Start] --> B[Concept 1]\\n  B --> C[Concept 2]",
  "keyTerms": [
    { "term": "Term name", "definition": "Short, clear definition" }
  ]
}

Rules:
- Generate 5-8 notes sections covering the main topics in order they appear.
- Generate exactly 5 quiz questions, testing different concepts, increasing in difficulty.
- "correctIndex" must be a 0-based index into "options".
- "mermaidFlowchart" must be valid Mermaid flowchart syntax (flowchart TD), showing how the main concepts connect or the sequence of steps in the video. Use \\n for newlines inside the string. Keep node labels short (2-5 words). 6-12 nodes max.
- Generate 6-10 key terms with concise definitions.
- If the transcript is too short or unclear for a full study kit, still return valid JSON with your best effort — never return an empty object.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    const isRetryable = err?.status === 503 || err?.status === 429;

    if (isRetryable && retries > 0) {
      const waitMs = err?.status === 503 ? 8000 : 60000;
      console.log(
        `⏳ Gemini ${err.status}. Retrying in ${waitMs / 1000}s... (${retries} left)`
      );
      await sleep(waitMs);
      return exports.generateStudyMaterial(transcript, retries - 1);
    }

    throw err;
  }
};