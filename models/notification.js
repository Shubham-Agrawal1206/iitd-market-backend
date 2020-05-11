var mongoose = require("mongoose");

var notificationSchema = new mongoose.Schema({
	targetUser: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	message: String,
	isRead: { type: Boolean, default: false }
}, {
	timestamps: true
});

module.exports = mongoose.model("Notification", notificationSchema);