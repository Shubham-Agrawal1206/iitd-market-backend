var express = require("express");
var router  = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var User = require("../models/user");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var geocoder = require('geocoder');
var request = require("request");
var { isLoggedIn, checkUserCampground, checkUserComment, isAdmin, isSafe } = middleware; // destructuring assignment

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

    //INDEX - show all campgrounds
// router.get("/", function(req, res){
//   var perPage = 8;
//   var pageQuery = parseInt(req.query.page);
//   var pageNumber = pageQuery ? pageQuery : 1;
//   var noMatch = null;
//     if(req.query.search) {
//       const regex = new RegExp(escapeRegex(req.query.search), 'gi');
//       Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
//         Campground.count({name: regex}).exec(function (err, count) {
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
//       Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
//         Campground.count().exec(function (err, count) {
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

//INDEX - show all campgrounds
router.get("/", function(req, res){
  if(req.query.search && req.xhr) {
      const regex = new RegExp(escapeRegex(req.query.search), 'gi');
      // Get all campgrounds from DB
      Campground.find({name: regex}, function(err, allCampgrounds){
         if(err){
            console.log(err);
         } else {
            res.status(200).json(allCampgrounds);
         }
      });
  } else {
      // Get all campgrounds from DB
      Campground.find({}, function(err, allCampgrounds){
         if(err){
             console.log(err);
         } else {
            if(req.xhr) {
              res.json(allCampgrounds);
            } else {
              res.render("campgrounds/index",{campgrounds: allCampgrounds, page: 'campgrounds'});
            }
         }
      });
  }
});

//CREATE - add new campground to DB
router.post("/", isLoggedIn, upload.single('image'), function(req, res){
  // get data from form and add to campgrounds array
  console.log(req.file);
  cloudinary.v2.uploader.upload(req.file.path,function(err,result){
    if(err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
  var name = req.body.name;
  var image = result.secure_url;
  var imageId = result.public_id;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  var cost = req.body.cost;
  geocoder1.geocode(req.body.location,async function (err, data) {
    if (err || data.status === 'ZERO_RESULTS') {
      console.log(err,data);
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    console.log(data);
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = {name: name, image: image, imageId:imageId,description: desc, cost: cost, author:author, location: location, lat: lat, lng: lng};
    console.log(newCampground);
    // Create a new campground and save to DB
    try {
      let campground = await Campground.create(newCampground);
      let user = await User.findById(req.user._id).populate('followers').exec();
      let newNotification = {
        username: req.user.username,
        campgroundId: campground.id
      }
      for(const follower of user.followers) {
        let notification = await Notification.create(newNotification);
        await follower.notifications.push(notification);
        follower.save();
      }
      //redirect back to campgrounds page
      res.redirect(`/campgrounds/${campground.id}`);
    } catch(err) {
      req.flash('error', err.message);
      return res.redirect('back');
    }
    // Campground.create(newCampground, function(err, newlyCreated){
    //     if(err){
    //         console.log(err);
    //     } else {
    //         //redirect back to campgrounds page
    //         console.log(newlyCreated);
    //         return res.redirect("/campgrounds");
    //     }
    // });
  });
});
});

//NEW - show form to create new campground
router.get("/new", isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
      path:"reviews",
      options:{sort:{createdAt:-1}}
    }).exec(function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            return res.redirect('/campgrounds');
        }
        request("https://www.metaweather.com/api/location/search/?lattlong="+foundCampground.lat+","+foundCampground.lng,{json:true},function(err,resp,body){
          if(err)
          {
            req.flash("error","Weather not available");
            return res.render("campgrounds/show", {campground: foundCampground,weather:[]});
          }
          var wid = body[0].woeid;
          request("https://www.metaweather.com/api/location/"+wid,{json:true},function(error,resp,mbody){
            if(error){
              req.flash("error","Weather not available");
              return res.render("campgrounds/show", {campground: foundCampground,weather:[]});
            }
            console.log(mbody);
            var mw = mbody.consolidated_weather;
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground,weather:mw});
          });
        });
    });
});

// EDIT - shows edit form for a campground
router.get("/:id/edit", isLoggedIn, checkUserCampground, function(req, res){
  //render edit template with that campground
  res.render("campgrounds/edit", {campground: req.campground});
});

// PUT - updates campground in the database
router.put("/:id",isLoggedIn, upload.single('image'), function(req, res){
  geocoder1.geocode(req.body.location, function (err, data) {
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    Campground.findById(req.params.id,async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
          if(req.file){
            try{
              await cloudinary.v2.uploader.destroy(campground.imageId);
              var result = await cloudinary.v2.uploader.upload(req.file.path); 
              campground.imageId = result.public_id;
              campground.image = result.secure_url; 
            } catch(err){
              req.flash("error", err.message);
              return res.redirect("back");
            }
           }
           campground.name = req.body.name;
           campground.description = req.body.description;
           campground.cost = req.body.cost;
           campground.location = location;
           campground.lat = lat;
           campground.lng = lng;
           await campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
  });
});

// DELETE - removes campground and its comments from the database
router.delete("/:id", isLoggedIn, checkUserCampground, function(req, res) {
    Comment.remove({
      _id: {
        $in: req.campground.comments
      }
    },async function(err) {
      if(err) {
          req.flash('error', err.message);
          return res.redirect('/');
      } else {
        await cloudinary.v2.uploader.destroy(req.campground.imageId);
        // deletes all reviews associated with the campground
        Review.remove({"_id": {$in: campground.reviews}}, function (err) {
          if (err) {
              console.log(err);
              return res.redirect("/campgrounds");
          }
          req.campground.remove(function(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('/');
            }
            req.flash('error', 'Campground deleted!');
            res.redirect('/campgrounds');
          });
      })
    }
  })
})

module.exports = router;

