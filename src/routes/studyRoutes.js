const express = require("express");
const studyRouter = express.Router();

const { userAuth } = require("../middlewares/auth");

const {
  createStudySession,
  getStudyHistory,
  getSingleStudySession,
  deleteStudySession,
} = require("../controllers/studyController");

studyRouter.post("/study", userAuth, createStudySession);

// IMPORTANT: this must come before "/study/:id", otherwise Express will
// match "history" as an :id param and this route will never be reached.
studyRouter.get("/study/history", userAuth, getStudyHistory);

studyRouter.get("/study/:id", userAuth, getSingleStudySession);
studyRouter.delete("/study/:id", userAuth, deleteStudySession);

module.exports = studyRouter;