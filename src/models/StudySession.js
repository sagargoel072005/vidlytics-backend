const mongoose = require("mongoose");

const studySessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    videoTitle: {
      type: String,
    },

    transcript: {
      type: String,
    },

    // Same duck-typing as Comparison.aiResult — Gemini sometimes returns a
    // parsed object, sometimes a raw "```json {...}```" string.
    aiResult: {
      type: Object,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StudySession", studySessionSchema);