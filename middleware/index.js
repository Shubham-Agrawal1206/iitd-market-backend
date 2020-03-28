var Comment = require('../models/comment');
var Course = require('../models/course');
var Review = require("../models/review");
var User = require("../models/user");
var Activity = require("../models/activity");

module.exports = {
  isLoggedIn:async function(req, res, next){
      if(req.isAuthenticated()){
        if(!req.user.isBanned){
          if(req.user.banExpires && req.user.banExpires> Date.now()){
            req.flash('error', 'User has been banned temporarily');
            return res.redirect('/course');
          }else{
            if(req.user.isVerified){
              return next()
            }else{
              req.flash("error", "You need to verify account first.");
              return res.redirect("back");
            }
          }
        }else{
          req.flash('error', 'User has been banned permanently');
          return res.redirect('back');
        }
      }
      req.flash('error', 'You must be signed in to do that!');
      res.redirect('/login');
  },
  isLoggedInAjax:async function(req, res, next){
    if(req.isAuthenticated()){
      if(!req.user.isBanned){
        if(req.user.banExpires && req.user.banExpires> Date.now()){
          req.flash('error', 'User has been banned temporarily');
          return res.status(500).send('/course');
        }else{
          if(req.user.isVerified){
            return next();
          }else{
            req.flash("error", "You need to verify account first.");
            return res.status(500).send("/login");
          }
        }
      }else{
        req.flash('error', 'User has been banned permanently');
        return res.status(500).send('/course');
      }
    }
    req.flash('error', 'You must be signed in to do that!');
    res.status(500).send("/login");
},
  checkUserCourse: function(req, res, next){
    Course.findOne({slug:req.params.slug}).exec(function(err, foundCourse){
      if(err || !foundCourse){
          console.log(err);
          req.flash('error', 'Sorry, that course does not exist!');
          res.redirect('/course');
      } else if(foundCourse.author.slug === req.user.slug || req.user.isAdmin){
          req.course = foundCourse;
          next();
      } else {
        for(const instruct of foundCourse.instructor){
          if(instruct.uslug === req.user.slug){
           req.course = foundCourse;
           return next();
          }
        }
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect('/course/' + req.params.slug);
      }
    });
  },
  checkUserComment: function(req, res, next){
    Comment.findById(req.params.commentId, function(err, foundComment){
       if(err || !foundComment){
           console.log(err);
           req.flash('error', 'Sorry, that comment does not exist!');
           res.redirect('/course');
       } else if(foundComment.author.slug === req.user.slug || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash('error', 'You don\'t have permission to do that!');
           res.redirect('/course/' + req.params.slug);
       }
    });
  },
  isAdmin: function(req, res, next) {
    if(req.user && req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.redirect('/course');
    }
  },
  isAllowed: function(req,res,next){
    if(req.user && (req.user.isProfessor || req.user.isAdmin)){
      next();
    }else{
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      return res.redirect('back');
    }
  },
  checkReviewOwnership : function(req, res, next) {
    if(req.isAuthenticated()){
      Review.findById(req.params.review_id, function(err, foundReview){
        if(err || !foundReview){
          res.redirect("back");
        }  else {
          // does user own the comment?
          if(foundReview.author.slug === req.user.slug || req.user.isAdmin) {
          next();
          } else {
            req.flash("error", "You don't have permission to do that");
            res.redirect("back");
          }
        }
      });
    } else {
      req.flash("error", "You need to be logged in to do that");
      res.redirect("back");
    }
  },
  checkReviewExistence : function (req, res, next) {
    if (req.isAuthenticated()) {
      Course.findOne({slug:req.params.slug}).populate("reviews").exec(function (err, foundCourse) {
        if (err || !foundCourse) {
          req.flash("error", "Course not found.");
          res.redirect("back");
        } else {
          // check if req.user._id exists in foundCourse.reviews
          var foundUserReview = foundCourse.reviews.some(function (review) {
            return review.author.slug === req.user.slug;
          });
          if (foundUserReview) {
            req.flash("error", "You already wrote a review.");
            return res.redirect("/course/" + foundCourse.slug);
          }
          // if the review was not found, go to the next middleware
          next();
        }
      });
  } else {
    req.flash("error", "You need to login first.");
    res.redirect("back");
  }
},
checkUserReviewExistence : function (req, res, next) {
  if (req.isAuthenticated()) {
    User.findOne({slug:req.params.slug}).populate("reviews").exec(function (err, foundUser) {
      if (err || !foundUser) {
        req.flash("error", "User not found.");
        res.redirect("back");
      } else {
        // check if req.user._id exists in foundCourse.reviews
        var foundUserReview = foundUser.reviews.some(function (review) {
          return review.author.slug === req.user.slug;
        });
        if (foundUserReview) {
          req.flash("error", "You already wrote a review.");
          return res.redirect("/users/" + foundUser.slug);
        }
        // if the review was not found, go to the next middleware
        next();
      }
    });
} else {
  req.flash("error", "You need to login first.");
  res.redirect("back");
}
},
  checkUser: async function(req,res,next){
    let user = await User.findOne({username:req.body.username}).exec();
    if(user.isBanned){
      req.flash('error', 'User has been banned permanently');
      return res.redirect('back');
    }else if(user.banExpires && user.banExpires > Date.now()){
      req.flash('error', 'User has been banned temporarily');
      return res.redirect('back'); 
    }else{
      if(user.isVerified){
      let newActivity = {
        username: user.username,
        targetSlug: user.slug,
        isCourse: false,
        message: "login"
      }
      let activity = await Activity.create(newActivity);
      await user.activity.push(activity);
      await user.save();
      next();
    }else{
      req.flash("error", "You need to verify account first.");
      res.redirect("back");
    }
    }
  },
  checkUserAct: async function(req,res,next){
    let userx = await User.findById(req.user.id).exec();
    if(userx.id === req.user.id || req.user.isAdmin){
      next();
    }else{
      req.flash('error', 'You are not allowed to see this');
      return res.redirect('/users'); 
    }
  }
}