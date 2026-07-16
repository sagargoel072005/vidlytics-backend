

const {
YoutubeTranscript
} = require("youtube-transcript");

exports.getTranscript = async(videoUrl)=>{

   try {
  const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
  return transcript.map(t => t.text).join(" ");
} catch (err) {
  console.error("Transcript Error:", err.message);
  throw err;
}
};
