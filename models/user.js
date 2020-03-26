var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type:String,unique:true,required:true},
    password: String,
    avatar:String,
    firstName:String,
    lastName:String,
    email:{type:String,required:true,unique:true},
    resetPasswordToken:String,
    resetPasswordExpires:Date,
    isBanned: {type: Boolean, default: false},
    banExpires:Date,
    isAdmin: {type: Boolean, default: false},
    isVerified: {type: Boolean, default:false},
    isProfessor: {type: Boolean, default:false},
    notifications:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: 'Notification'
        }
    ],
    followers:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    reviews:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    rating:{
        type:Number,
        default:0
    },
    activity:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref: 'Activity'
        }
    ]
},{
    timestamps:true
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);