const express = require("express");

const {fetchTranscript,} = require("../controllers/transcriptController");

const { userAuth } = require("../middlewares/auth");

const transcriptRouter = express.Router();

transcriptRouter.post(
  "/transcript",
  userAuth,
  fetchTranscript
);

module.exports = transcriptRouter;