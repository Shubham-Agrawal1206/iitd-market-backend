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
          return next();
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
        return next();
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
    Course.findById(req.params.id).exec(function(err, foundCourse){
      if(err || !foundCourse){
          console.log(err);
          req.flash('error', 'Sorry, that course does not exist!');
          res.redirect('/course');
      } else if(foundCourse.author.id.equals(req.user._id) || req.user.isAdmin){
          req.course = foundCourse;
          next();
      } else {
        for(const instruct of foundCourse.instructor){
          if(instruct.id.equals(req.user._id)){
           req.course = foundCourse;
           return next();
          }
        }
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect('/course/' + req.params.id);
      }
    });
  },
  checkUserComment: function(req, res, next){
    Comment.findById(req.params.commentId, function(err, foundComment){
       if(err || !foundComment){
           console.log(err);
           req.flash('error', 'Sorry, that comment does not exist!');
           res.redirect('/course');
       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash('error', 'You don\'t have permission to do that!');
           res.redirect('/course/' + req.params.id);
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
          if(foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
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
      Course.findById(req.params.id).populate("reviews").exec(function (err, foundCourse) {
        if (err || !foundCourse) {
          req.flash("error", "Course not found.");
          res.redirect("back");
        } else {
          // check if req.user._id exists in foundCourse.reviews
          var foundUserReview = foundCourse.reviews.some(function (review) {
            return review.author.id.equals(req.user._id);
          });
          if (foundUserReview) {
            req.flash("error", "You already wrote a review.");
            return res.redirect("/course/" + foundCourse._id);
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
    User.findById(req.params.id).populate("reviews").exec(function (err, foundUser) {
      if (err || !foundUser) {
        req.flash("error", "User not found.");
        res.redirect("back");
      } else {
        // check if req.user._id exists in foundCourse.reviews
        var foundUserReview = foundUser.reviews.some(function (review) {
          return review.author.id.equals(req.user._id);
        });
        if (foundUserReview) {
          req.flash("error", "You already wrote a review.");
          return res.redirect("/users/" + foundUser._id);
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
      let newActivity = {
        username: user.username,
        targetId: user.id,
        isCourse: false,
        message: "login"
      }
      let activity = await Activity.create(newActivity);
      await user.activity.push(activity);
      await user.save();
      next();
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