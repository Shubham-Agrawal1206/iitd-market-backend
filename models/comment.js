var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    isReported: {type:Boolean,default:false}
},
{
    timestamps:true
});

module.exports = mongoose.model("Comment", commentSchema);