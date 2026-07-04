const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { validateSignUpData } = require("../utils/validation");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
    try {
        validateSignUpData(req);
        const { firstName, lastName, emailId, password } = req.body;
        const hashPassword = await bcrypt.hash(password, 10);

        const user = new User({
            firstName, lastName, emailId, password: hashPassword
        })

        const savedUser = await user.save();
        const token = await savedUser.getJWT();

        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000),
        });

        res.json({
            message: "signup successfully",
            data: savedUser
        })

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
})


authRouter.post("/login", async (req, res) => {
    try {

        const { emailId, password } = req.body;
        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            const token = await user.getJWT();

            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000),
            });
            return res.json({
                message: "Login Successful !!",
                user: user,
            });
        } else{
            return res.status(401).json({
                success: false,
                message: "Invalid password"
            });
        }


    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
});


authRouter.post("/logout", async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
    });
    res.send("logout successfull!!!!");
})


module.exports = authRouter;
