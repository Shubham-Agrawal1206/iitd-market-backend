var mongoose = require("mongoose");

var activitySchema = new mongoose.Schema({
	username: String,
	targetSlug: String,
	isCourse: Boolean,
	message: String
},{
	timestamps:true
});

module.exports = mongoose.model("Activity", activitySchema);