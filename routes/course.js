var express = require("express");
var router  = express.Router();
var Course = require("../models/course");
var Comment = require("../models/comment");
var Review = require("../models/review");
var User = require("../models/user");
var Activity = require("../models/activity");
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
router.post("/", middleware.isLoggedIn, middleware.isAllowed, upload.single('image'), function(req, res){
  // get data from form and add to courses array
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
      slug: req.user.slug,
      username: req.user.username
  }
  var instructor = {
    uslug: req.user.slug,
    username: req.user.username
  }
  var studentNo = req.body.studentNo;
  geocoder1.geocode(req.body.location,async function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
      console.log(err);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCourse = {title: title, image: image, imageId:imageId, description: desc, studentNo: studentNo, author:author, location: location, lat: lat, lng: lng};
    // Create a new course and save to DB
    try {
      let course = await Course.create(newCourse);
      let user = await User.findById(req.user._id).populate('followers').exec();
      await course.instructor.push(instructor);
      await course.save();
      let newNotification = {
        username: req.user.username,
        targetSlug: course.slug,
        isCourse: true,
        message: "created a new course"
      }
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        await follower.notifications.push(notification);
        follower.save();
      }
      let userb = await User.findById(req.user.id).exec();
      let newActivity = {
        username: req.user.username,
        targetSlug: course.slug,
        isCourse: true,
        message: "created a new course"
      }
      let activity = await Activity.create(newActivity);
      await userb.activity.push(activity);
      await userb.save();
      //redirect back to courses page
      res.redirect(`/course/${course.slug}`);
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
router.get("/new", middleware.isLoggedIn, middleware.isAllowed, function(req, res){
   res.render("course/new"); 
});

// SHOW - shows more info about one course
router.get("/:slug", function(req, res){
    //find the course with provided ID
    Course.findOne({slug:req.params.slug}).populate("comments").populate({
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
            console.log(err);
            req.flash("error","Weather not available");
            return res.render("course/show", {course: foundCourse,weather:[]});
          }
          var wid = body[0].woeid;
          request("https://www.metaweather.com/api/location/"+wid,{json:true},async function(error,resp,mbody){
            if(error){
              req.flash("error","Weather not available");
              return res.render("course/show", {course: foundCourse,weather:[]});
            }
            var mw = mbody.consolidated_weather;
            if(req.user){
              let user = await User.findById(req.user.id).exec();
              let newActivity = {
                username: user.username,
                targetSlug: foundCourse.slug,
                isCourse: true,
                message: "visited course " + foundCourse.title
              }
              let activity = await Activity.create(newActivity);
              await user.activity.push(activity);
              await user.save();
              //render show template with that course
              res.render("course/show", {course: foundCourse,weather:mw,key:process.env.API_K});
            } else{
              //render show template with that course
            res.render("course/show", {course: foundCourse,weather:mw,key:process.env.API_K});
            }
          });
        });
    });
});

// EDIT - shows edit form for a course
router.get("/:slug/edit", middleware.isLoggedIn, middleware.isAllowed, middleware.checkUserCourse, function(req, res){
  //render edit template with that course
  res.render("course/edit", {course: req.course});
});

// PUT - updates course in the database
router.put("/:slug",middleware.isLoggedIn, middleware.isAllowed, middleware.checkUserCourse, upload.single('image'), function(req, res){
  geocoder1.geocode(req.body.location, function (err, data) {
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    Course.findOne({slug:req.params.slug}).exec(async function(err, course){
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
           let user = await User.findOne({slug:course.author.slug}).populate('followers').exec();
           let newNotification = {
            username: req.user.username,
            targetSlug: course.slug,
            isCourse: true,
            message: "updated course: " + req.body.title
          }
          for(const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            await follower.notifications.push(notification);
            follower.save();
          }
          let userb = await User.findById(req.user.id).exec();
          let newActivity = {
            username: req.user.username,
            targetSlug: course.slug,
            isCourse: true,
            message: "updated course: " + req.body.title
          }
          let activity = await Activity.create(newActivity);
          await userb.activity.push(activity);
          await userb.save();
           course.title = req.body.title;
           course.description = req.body.description;
           course.studentNo = req.body.studentNo;
           course.location = location;
           course.lat = lat;
           course.lng = lng;
           await course.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/course/" + course.slug);
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
router.delete("/:slug", middleware.isLoggedIn, middleware.isAllowed, middleware.checkUserCourse, function(req, res) {
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
            let user = await User.findOne({slug:req.course.author.slug}).populate('followers').exec();
            let newNotification = {
              username: req.user.username,
              targetSlug: req.course.slug,
              isCourse: true,
              message: "deleted course: " + req.course.title
            }
            for(const follower of user.followers) {
              let notification = await Notification.create(newNotification);
              await follower.notifications.push(notification);
              follower.save();
              req.flash('error', 'Course deleted!');
              res.redirect('/course');
            }
            let userb = await User.findById(req.user.id).exec();
            let newActivity = {
              username: req.user.username,
              targetSlug: req.course.slug,
              isCourse: true,
              message: "deleted course: " + req.course.title
            }
            let activity = await Activity.create(newActivity);
            await userb.activity.push(activity);
            await userb.save();
            await req.course.remove();
            req.flash('error', 'Course deleted!');
            res.redirect('/course');
          }catch(err){
            console.log(err);
            return res.redirect("/course");
          }
      })
    }
  })
})

router.get("/:slug/addinst",middleware.isLoggedIn,middleware.isAllowed,middleware.checkUserCourse,function(req,res){
  res.render("course/instr",{cslug:req.params.slug});
})

router.put("/:slug/addinst",middleware.isLoggedIn,middleware.isAllowed,middleware.checkUserCourse,async function(req,res){
  try {
    let course = await Course.findOne({slug:req.params.slug}).exec();
    let user = await User.findOne({username:req.body.username}).exec();
    if(!user || !user.isProfessor){
      req.flash('error', 'No valid user found!');
      return res.redirect('back');
    }
    let instructor = {uslug:user.slug,username:user.username};
    await course.instructor.push(instructor);
    await course.save();
    let userb = await User.findById(req.user.id).exec();
    let newActivity = {
      username: req.user.username,
      targetSlug: course.slug,
      isCourse: true,
      message: "added course's instructor: " + req.body.username + " in " + course.title
    }
    let activity = await Activity.create(newActivity);
    await userb.activity.push(activity);
    await userb.save();
    req.flash('success', 'Instructor Added!');
    res.redirect('/course/'+ req.params.slug);
  } catch (err) {
    console.log(err);
    return res.redirect("/course");
  }
})

module.exports = router;