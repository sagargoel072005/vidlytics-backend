const express =require("express");
const chatRouter = express.Router();
const {askQuestion, getChatHistory} = require("../controllers/chatController");
const {userAuth} =require( "../middlewares/auth");

chatRouter.post("/chat/ask/question",userAuth,askQuestion);
chatRouter.get( "/chat/history/:videoId", userAuth,getChatHistory);

module.exports =chatRouter;