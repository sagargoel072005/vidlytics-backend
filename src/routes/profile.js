const express =require("express");
const {userAuth} =require( "../middlewares/auth");
const profileRouter = express.Router();

profileRouter.get(
 "/profile/view",
 userAuth,
 async(req,res)=>{

  const user = req.user;

  res.json({
   _id:user._id,
   firstName:user.firstName,
   lastName:user.lastName,
   emailId:user.emailId
  });

 });

module.exports =profileRouter;