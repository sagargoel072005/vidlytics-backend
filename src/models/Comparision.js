const mongoose = require("mongoose");

const comparisonSchema = new mongoose.Schema(
{
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    video1:{
        type:String,
        required:true
    },

    video2:{
        type:String,
        required:true
    },

    transcript1:{
        type:String
    },

    transcript2:{
        type:String
    },

    aiResult:{
        type:Object
    }
},
{
    timestamps:true
}
);

module.exports = mongoose.model(
    "Comparison",
    comparisonSchema
);