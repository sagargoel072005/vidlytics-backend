const StudySession = require("../models/StudySession");
const studyQueue = require("../queues/studyQueue");

exports.createStudySession = async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "videoUrl is required",
      });
    }

    const job = await studyQueue.add(
      "generate-study",
      {
        userId: req.user.id,
        videoUrl,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000, // 5s, then 10s, then 20s
        },
      }
    );

    res.json({
      success: true,
      jobId: job.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getStudyHistory = async (req, res) => {
  try {
    const history = await StudySession.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSingleStudySession = async (req, res) => {
  try {
    const studySession = await StudySession.findById(req.params.id);

    if (!studySession) {
      return res.status(404).json({
        success: false,
        message: "Study session not found",
      });
    }

    res.status(200).json({
      success: true,
      studySession,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteStudySession = async (req, res) => {
  try {
    await StudySession.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};