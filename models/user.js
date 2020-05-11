var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    password: String,
    avatar: String,
    contact_number: String,
    entry_number: String,
    hostel: String,
    chats: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Chat'
        }
    ],
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    isBanned: { type: Boolean, default: false },
    banExpires: Date,
    isAdmin: { type: Boolean, default: false },
    description: String,
    notifs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Notification'
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    rating: {
        type: Number,
        default: 0
    },
    folCategory: [
        {
            type: String
        }
    ]
}, {
    timestamps: true
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);