const express =require("express");
const chatRouter = express.Router();
const {askQuestion, getChatHistory} = require("../controllers/chatController");
const {userAuth} =require( "../middlewares/auth");

chatRouter.post("/ask/question",userAuth,askQuestion);
chatRouter.get( "/history/:videoId", userAuth,getChatHistory);

module.exports =chatRouter;