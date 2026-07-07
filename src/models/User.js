const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            index: true,
            minLength: 2,
            maxLength: 20,
        },
        lastName: { type: String },
        emailId: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            validate(value) {
                if (!validator.isEmail(value)) throw new Error("Invalid Email Id: " + value);
            },
        },
        password: {
            type: String,
            required: function () { return this.authProvider === "local"; },
            validate(value) {
                if (this.authProvider === "google") return true;
                if (!validator.isStrongPassword(value)) throw new Error("Invalid Password: " + value);
            },
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },


        photoUrl: { type: String, default: "" },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
        age: {
            type: Number,
            min: 13,
            max: 120,
        },
    },
    { timestamps: true }
)
userSchema.methods.getJWT = async function () {
    const token = await jwt.sign({ _id: this._id }, process.env.JWT_TOKEN, {
        expiresIn: "1d",
    });
    return token;
};
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = UserModel;
