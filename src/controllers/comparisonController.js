const Comparison = require("../models/Comparision");
const { getTranscript, } = require("../services/transcriptService");
const { compareVideos, } = require("../services/geminiService");
const { comparisonQueue } = require("../queues/comparisonQueue");

exports.compareVideosController =
  async (req, res) => {

    const { video1, video2 } =
      req.body;

    const job =
      await comparisonQueue.add(
        "compare-video",
        {
          userId: req.user.id,
          video1,
          video2
        }
      );

    res.json({
      success: true,
      jobId: job.id
    });

  };

exports.getHistory =
  async (req, res) => {

    try {

      const history =
        await Comparison.find({
          userId: req.user.id
        })
          .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        history
      });

    }
    catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  };

exports.getSingleComparison =
  async (req, res) => {

    try {

      const comparison =
        await Comparison.findById(
          req.params.id
        );

      if (!comparison) {
        return res.status(404).json({
          success: false,
          message: "Comparison Not Found"
        });
      }

      res.status(200).json({
        success: true,
        comparison
      });

    }
    catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  };


exports.deleteComparison =
  async (req, res) => {

    try {

      await Comparison.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: "Deleted Successfully"
      });

    }
    catch (error) {

      res.status(500).json({
        success: false,
        message: error.message
      });

    }
  };