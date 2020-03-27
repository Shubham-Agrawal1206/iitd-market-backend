var mongoose = require("mongoose");

var instructorSchema = new mongoose.Schema({
   uslug:{
      type: String,
      required: true,
      unique:true
   },
   username:String
},{_id:false})

var courseSchema = new mongoose.Schema({
   title: {type:String,
      required:"Course title cannot be blank"         
   },
   slug:{
      type:String,
      unique:true
   },
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
      slug: {
         type: String
      },
      username: String
   },
   instructor: [instructorSchema],
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

courseSchema.pre('save', async function (next) {
   try {
       // check if a new course is being saved, or if the course title is being modified
       if (this.isNew || this.isModified("title")) {
           this.slug = await generateUniqueSlug(this._id, this.title);
       }
       next();
   } catch (err) {
       next(err);
   }
});

var Course = mongoose.model("Course", courseSchema);

module.exports = Course;

async function generateUniqueSlug(id, courseTitle, slug) {
   try {
       // generate the initial slug
       if (!slug) {
           slug = slugify(courseTitle);
       }
       // check if a campground with the slug already exists
       var course = await Course.findOne({slug: slug});
       // check if a campground was found or if the found campground is the current campground
       if (!course || course._id.equals(id)) {
           return slug;
       }
       // if not unique, generate a new slug
       var newSlug = slugify(courseTitle);
       // check again by calling the function recursively
       return await generateUniqueSlug(id, courseTitle, newSlug);
   } catch (err) {
       throw new Error(err);
   }
}

function slugify(text) {
   var slug = text.toString().toLowerCase()
     .replace(/\s+/g, '-')        // Replace spaces with -
     .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
     .replace(/\-\-+/g, '-')      // Replace multiple - with single -
     .replace(/^-+/, '')          // Trim - from start of text
     .replace(/-+$/, '')          // Trim - from end of text
     .substring(0, 75);           // Trim at 75 characters
   return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}