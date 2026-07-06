const express = require("express");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const Comparison = require("../models/comparision");

const profileRouter = express.Router();

// GET /profile/view
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// GET /profile/stats
profileRouter.get("/profile/stats", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    const comparisons = await Comparison.find({ userId }).sort({
      createdAt: -1,
    });

    const totalComparisons = comparisons.length;
    const videosAnalyzed = totalComparisons * 2;

    const scores = [];

    for (const c of comparisons) {
      if (!c.aiResult) continue;

      let parsed = c.aiResult;

      // agar aiResult string hai (markdown-wrapped JSON), to usko clean karke parse karo
      if (typeof parsed === "string") {
        try {
          const cleaned = parsed.replace(/```json|```/g, "").trim();
          parsed = JSON.parse(cleaned);
        } catch (e) {
          continue; // parse fail hua to skip karo
        }
      }

      // similarityScore "85%" jaisa string ho sakta hai, usse number banao
      const rawScore = parsed?.similarityScore;
      if (rawScore === undefined || rawScore === null) continue;

      const numericScore =
        typeof rawScore === "string"
          ? parseFloat(rawScore.replace("%", ""))
          : rawScore;

      if (!isNaN(numericScore)) {
        scores.push(numericScore);
      }
    }

    const avgSimilarityScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    res.send({
      totalComparisons,
      videosAnalyzed,
      avgSimilarityScore,
      recentComparisons: comparisons.slice(0, 5),
    });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});


// PATCH /profile/edit
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    const ALLOWED_UPDATES = ["firstName", "lastName", "emailId"];

    const isEditAllowed = Object.keys(req.body).every((field) =>
      ALLOWED_UPDATES.includes(field)
    );

    if (!isEditAllowed) {
      throw new Error("Update not allowed on these fields");
    }

    if (req.body.emailId && !validator.isEmail(req.body.emailId)) {
      throw new Error("Invalid Email Id");
    }

    const user = req.user;
    Object.keys(req.body).forEach((key) => (user[key] = req.body[key]));
    await user.save();

    res.send({ message: "Profile updated successfully", data: user });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

// PATCH /profile/password
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new Error("Old and new password are required");
    }

    const user = req.user;

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Old password is incorrect");
    }

    if (!validator.isStrongPassword(newPassword)) {
      throw new Error("New password is not strong enough");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.send({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).send("ERROR: " + err.message);
  }
});

module.exports = profileRouter;