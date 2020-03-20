var mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
   title: String,
   image: String,
   imageId: String,
   description: String,
   studentNo: {
      type:Number,
      min:0,
      validate:{
         validator:Number.isInteger,
         message:"{VALUE} is not an integer value."
      }
   },
   location: String,
   lat: Number,
   lng: Number,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
   reviews:[
      {
         type:  mongoose.Schema.Types.ObjectId,
         ref: "Review"
      }
   ],
   rating:{
      type:Number,
      default:0
   }
},
{
   timestamps:true
});

module.exports = mongoose.model("Course", courseSchema);