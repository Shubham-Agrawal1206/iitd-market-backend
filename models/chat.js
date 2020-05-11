var mongoose = require("mongoose");

var chatSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    },
    messages: [
        {
            type: String
        }
    ]
}, {
    timestamps: true
})

module.exports = mongoose.model('Chat', chatSchema)