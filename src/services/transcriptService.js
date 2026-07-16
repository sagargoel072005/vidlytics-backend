

const {
YoutubeTranscript
} = require("youtube-transcript");

exports.getTranscript = async(videoUrl)=>{

    const transcript =
    await YoutubeTranscript.fetchTranscript(
        videoUrl
    );

    return transcript
    .map(item=>item.text)
    .join(" ");
};
