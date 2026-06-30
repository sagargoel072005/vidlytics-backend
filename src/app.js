require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

const app = express();

const authRouter = require("./routes/auth");
const transcriptRouter = require("./routes/transcript");
const comparisionRouter =require("./routes/comparision");
const chatRouter = require("./routes/chat");
const sseRouter = require("./routes/sse");
const {createCollection}=require("./config/qdrant");

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/",transcriptRouter);
app.use("/",comparisionRouter);
app.use("/",chatRouter);
app.use("/",sseRouter);


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