var Comment = require('../models/comment');
var Course = require('../models/course');
var Review = require("../models/review");

module.exports = {
  isLoggedIn: function(req, res, next){
      if(req.isAuthenticated()){
          return next();
      }
      req.flash('error', 'You must be signed in to do that!');
      res.redirect('/login');
  },
  checkUserCourse: function(req, res, next){
    Course.findById(req.params.id, function(err, foundCourse){
      if(err || !foundCourse){
          console.log(err);
          req.flash('error', 'Sorry, that course does not exist!');
          res.redirect('/course');
      } else if(foundCourse.author.id.equals(req.user._id) || req.user.isAdmin){
          req.course = foundCourse;
          next();
      } else {
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
    if(req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.redirect('back');
    }
  },
  checkReviewOwnership : function(req, res, next) {
    if(req.isAuthenticated()){
      Review.findById(req.params.review_id, function(err, foundReview){
        if(err || !foundReview){
          res.redirect("back");
        }  else {
          // does user own the comment?
          if(foundReview.author.id.equals(req.user._id)) {
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
}
}