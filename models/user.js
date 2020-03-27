var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: {type:String,unique:true,required:true},
    slug:{type:String,unique:true},
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
    description:String,
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

UserSchema.pre('save',async function(next){
    try {
        // check if a new campground is being saved, or if the campground name is being modified
        if (this.isNew || this.isModified("username")) {
            this.slug = await generateUniqueSlug(this._id, this.username);
        }
        next();
    } catch (err) {
        next(err);
    }
})

var User = mongoose.model("User", UserSchema);

module.exports = User;

async function generateUniqueSlug(id, username, slug) {
    try {
        // generate the initial slug
        if (!slug) {
            slug = slugify(username);
        }
        // check if a campground with the slug already exists
        var user = await User.findOne({slug: slug});
        // check if a campground was found or if the found campground is the current campground
        if (!user || user._id.equals(id)) {
            return slug;
        }
        // if not unique, generate a new slug
        var newSlug = slugify(username);
        // check again by calling the function recursively
        return await generateUniqueSlug(id, username, newSlug);
    } catch (err) {
        throw new Error(err);
    }
}

function slugify(text) {
    var slug = text.toString().toLowerCase()
      .replace(/\s+/g, '_')        // Replace spaces with _
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')          // Trim - from start of text
      .replace(/-+$/, '')          // Trim - from end of text
      .substring(0, 75);           // Trim at 75 characters
    return "~" + slug;  
}