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
    ],
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// const ArrLen = (val) => val.length === 2

// chatSchema.path('users').validate(ArrLen, '{PATH} exceeds length');

module.exports = mongoose.model('Chat', chatSchema);