var express = require("express");
var router  = express.Router();
var Course = require("../models/course");
var Comment = require("../models/comment");
var Review = require("../models/review");
var User = require("../models/user");
var Notification = require("../models/notification");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var geocoder = require('geocoder');
var request = require("request");

var options = {
  provider : 'google',
  httpAdapter:'https',
  apiKey : process.env.GEOCODER_API_KEY,
  formatter: null
}

var geocoder1 = NodeGeocoder(options); 

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'cloudxx365', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

    //INDEX - show all courses
// router.get("/", function(req, res){
//   var perPage = 8;
//   var pageQuery = parseInt(req.query.page);
//   var pageNumber = pageQuery ? pageQuery : 1;
//   var noMatch = null;
//     if(req.query.search) {
//       const regex = new RegExp(escapeRegex(req.query.search), 'gi');
//       Course.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
//         Course.count({name: regex}).exec(function (err, count) {
//           if (err) {
//             console.log(err);
//             return res.redirect("back");
//           } else {
//             if(allCampgrounds.length < 1) {
//               noMatch = "No campgrounds match that query, please try again.";
//             }
//             res.render("campgrounds/index", {
//               campgrounds: allCampgrounds,
//               current: pageNumber,
//               pages: Math.ceil(count / perPage),
//               noMatch: noMatch,
//               search: req.query.search
//             });
//           }
//         });
//       });
//     } else {
//       // get all campgrounds from DB
//       Course.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
//         Course.count().exec(function (err, count) {
//           if (err) {
//             console.log(err);
//           } else {
//             res.render("campgrounds/index", {
//               campgrounds: allCampgrounds,
//               current: pageNumber,
//               pages: Math.ceil(count / perPage),
//               noMatch: noMatch,
//               search: false
//             });
//           }
//         });
//       });
//     }
// });

//INDEX - show all courses
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all courses from DB
      Course.find({title: regex}, function(err, allCourse){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCourse);
         }
      });
  } else {
      // Get all courses from DB
      Course.find({}, function(err, allCourse){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCourse);
            } else {
              res.render("course/index",{course: allCourse, page: 'course'});
            }
         }
      });
  }
});

//CREATE - add new course to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to courses array
  console.log(req.file);
  cloudinary.v2.uploader.upload(req.file.path,function(err,result){
    if(err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
  var title = req.body.title;
  var image = result.secure_url;
  var imageId = result.public_id;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var studentNo = req.body.studentNo;
  geocoder1.geocode(req.body.location,async function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
      console.log(err,data);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCourse = {title: title, image: image, imageId:imageId,description: desc, studentNo: studentNo, author:author, location: location, lat: lat, lng: lng};
    // Create a new course and save to DB
    try {
      let course = await Course.create(newCourse);
      let user = await User.findById(req.user._id).populate('followers').exec();
      let newNotification = {
        username: req.user.username,
        courseId: course.id,
        message: "created a new course"
      }
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        await follower.notifications.push(notification);
        follower.save();
      }
      //redirect back to courses page
      res.redirect(`/course/${course.id}`);
    } catch(err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // Course.create(newcourse, function(err, newlyCreated){
    //     if(err){
    //         console.log(err);
    //     } else {
    //         //redirect back to courses page
    //         console.log(newlyCreated);
    //         return res.redirect("/courses");
    //     }
    // });
  });
});
});

//NEW - show form to create new course
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("course/new"); 
});

// SHOW - shows more info about one course
router.get("/:id", function(req, res){
    //find the course with provided ID
    Course.findById(req.params.id).populate("comments").populate({
      path:"reviews",
      options:{sort:{createdAt:-1}}
    }).exec(function(err, foundCourse){
        if(err || !foundCourse){
            console.log(err);
            req.flash('error', 'Sorry, that course does not exist!');
            return res.redirect('/course');
        }
        request("https://www.metaweather.com/api/location/search/?lattlong="+foundCourse.lat+","+foundCourse.lng,{json:true},function(err,resp,body){
          if(err)
          {
            req.flash("error","Weather not available");
            return res.render("course/show", {course: foundCourse,weather:[]});
          }
          var wid = body[0].woeid;
          request("https://www.metaweather.com/api/location/"+wid,{json:true},function(error,resp,mbody){
            if(error){
              req.flash("error","Weather not available");
              return res.render("course/show", {course: foundCourse,weather:[]});
            }
            var mw = mbody.consolidated_weather;
            //render show template with that course
            res.render("course/show", {course: foundCourse,weather:mw});
          });
        });
    });
});

// EDIT - shows edit form for a course
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkUserCourse, function(req, res){
  //render edit template with that course
  res.render("course/edit", {course: req.course});
});

// PUT - updates course in the database
router.put("/:id",middleware.isLoggedIn, upload.single('image'), function(req, res){
  geocoder1.geocode(req.body.location, function (err, data) {
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    Course.findById(req.params.id).exec(async function(err, course){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
        try{
          if(req.file){
            try{
              await cloudinary.v2.uploader.destroy(course.imageId);
              var result = await cloudinary.v2.uploader.upload(req.file.path); 
              course.imageId = result.public_id;
              course.image = result.secure_url; 
            } catch(err){
              req.flash("error", err.message);
              return res.redirect("back");
            }
           }
           let user = await User.findById(course.author.id).populate('followers').exec();
           let newNotification = {
            username: req.user.username,
            courseId: course.id,
            message: "updated course: " + req.body.title
          }
          for(const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            await follower.notifications.push(notification);
            follower.save();
          }
           course.title = req.body.title;
           course.description = req.body.description;
           course.studentNo = req.body.studentNo;
           course.location = location;
           course.lat = lat;
           course.lng = lng;
           await course.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/course/" + course._id);
          } catch(err){
            console.log(err)
            req.flash("error", err.message);
            return res.redirect("back");
          }
        }
    });
  });
});

// DELETE - removes course and its comments from the database
router.delete("/:id", middleware.isLoggedIn, middleware.checkUserCourse, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.course.comments
      }
    },async function(err) {
      if(err) {
          req.flash('error', err.message);
          return res.redirect('/');
      } else {
        await cloudinary.v2.uploader.destroy(req.course.imageId);
        // deletes all reviews associated with the course
        Review.remove({"_id": {$in: req.course.reviews}},async function (err) {
          try{
            let user = await User.findById(req.course.author.id).populate('followers').exec();
            let newNotification = {
              username: req.user.username,
              courseId: req.course.id,
              message: "deleted course: " + req.course.title
            }
            for(const follower of user.followers) {
              let notification = await Notification.create(newNotification);
              await follower.notifications.push(notification);
              follower.save();
              req.flash('error', 'Course deleted!');
              res.redirect('/course');
            }
            await req.course.remove();
          }catch(err){
            console.log(err);
            return res.redirect("/course");
          }
            req.flash('error', 'Course deleted!');
            res.redirect('/course');
      })
    }
  })
})

module.exports = router;