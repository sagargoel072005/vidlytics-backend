const {
  getTranscript,
} = require("../services/transcriptService");

exports.fetchTranscript = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Video URL Required",
      });
    }

    const transcript =
      await getTranscript(videoUrl);

    res.status(200).json({
      success: true,
      transcript,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};