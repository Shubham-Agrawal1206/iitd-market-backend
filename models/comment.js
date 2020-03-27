var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    author: {
        slug: {
            type: String
        },
        username: String
    },
    isReported: {type:Boolean,default:false},
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }
},
{
    timestamps:true
});

module.exports = mongoose.model("Comment", commentSchema);