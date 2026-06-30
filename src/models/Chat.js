const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        videoId: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["user", "assistant"]
        },

        content: String

    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Chat",
        chatSchema
    );