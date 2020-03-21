var mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema({
	username: String,
	courseId: String,
	message: String,
	isRead: { type: Boolean, default: false }
},{
	timestamps:true
});

module.exports = mongoose.model("Notification", notificationSchema);