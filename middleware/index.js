var Comment = require('../models/comment');
var Campground = require('../models/campground');
var Review = require("../models/review");

module.exports = {
  isLoggedIn: function(req, res, next){
      if(req.isAuthenticated()){
          return next();
      }
      req.flash('error', 'You must be signed in to do that!');
      res.redirect('/login');
  },
  checkUserCampground: function(req, res, next){
    Campground.findById(req.params.id, function(err, foundCampground){
      if(err || !foundCampground){
          console.log(err);
          req.flash('error', 'Sorry, that campground does not exist!');
          res.redirect('/campgrounds');
      } else if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
          req.campground = foundCampground;
          next();
      } else {
          req.flash('error', 'You don\'t have permission to do that!');
          res.redirect('/campgrounds/' + req.params.id);
      }
    });
  },
  checkUserComment: function(req, res, next){
    Comment.findById(req.params.commentId, function(err, foundComment){
       if(err || !foundComment){
           console.log(err);
           req.flash('error', 'Sorry, that comment does not exist!');
           res.redirect('/campgrounds');
       } else if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
            req.comment = foundComment;
            next();
       } else {
           req.flash('error', 'You don\'t have permission to do that!');
           res.redirect('/campgrounds/' + req.params.id);
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
  isSafe: function(req, res, next) {
    if(req.body.image.match(/^https:\/\/images\.unsplash\.com\/.*/)) {
      next();
    }else {
      req.flash('error', 'Only images from images.unsplash.com allowed.\nSee https://youtu.be/Bn3weNRQRDE for how to copy image urls from unsplash.');
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
      Campground.findById(req.params.id).populate("reviews").exec(function (err, foundCampground) {
        if (err || !foundCampground) {
          req.flash("error", "Campground not found.");
          res.redirect("back");
        } else {
          // check if req.user._id exists in foundCampground.reviews
          var foundUserReview = foundCampground.reviews.some(function (review) {
            return review.author.id.equals(req.user._id);
          });
          if (foundUserReview) {
            req.flash("error", "You already wrote a review.");
            return res.redirect("/campgrounds/" + foundCampground._id);
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