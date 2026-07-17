require("dotenv").config();
require("./workers/comparisonWorker");
require("./workers/studyWorker");
require("./config/passport");
const express = require("express");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const cors = require("cors");
const app = express();
app.use(passport.initialize());
const authRouter = require("./routes/auth");
const transcriptRouter = require("./routes/transcript");
const comparisionRouter =require("./routes/comparision");
const chatRouter = require("./routes/chat");
const sseRouter = require("./routes/sse");
const profileRouter = require("./routes/profile");
const studyRouter = require("./routes/studyRoutes");
const {createCollection}=require("./services/qdrantService");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://vidlytics.sagargoel.shop"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/",transcriptRouter);
app.use("/",comparisionRouter);
app.use("/",chatRouter);
app.use("/",sseRouter);
app.use("/",profileRouter);
app.use("/", studyRouter);

connectDB()
  .then(async () => {
    await createCollection();

    console.log("database connection established...");

    app.listen(process.env.PORT, "0.0.0.0", () => {
      console.log("our server is running on the port successfully");
    });
  })
  .catch((err) => {
    console.log(err);
    console.log("Database cannot be connected");
  });