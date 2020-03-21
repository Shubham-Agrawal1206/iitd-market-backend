var Comment = require('../models/comment');
var Course = require('../models/course');
var Review = require("../models/review");
var User = require("../models/user");

module.exports = {
  isLoggedIn:async function(req, res, next){
      if(req.isAuthenticated()){
        if(!req.user.isBanned){
          let user = User.findOne({_id:req.user.id,banExpires: { $gt: Date.now() }})
          if(!user){
            req.flash('error', 'User has been banned temporarily');
            return res.redirect('back');
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
  checkUserCourse: function(req, res, next){
    Course.findById(req.params.id).populate('instructor').exec(function(err, foundCourse){
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
    if(req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.redirect('back');
    }
  },
  isAllowed: function(req,res,next){
    if(req.user.isProfessor || req.user.isAdmin){
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
  checkUser: async function(req,res,next){
    let user = User.findOne({username:req.body.username}).exec();
    if(user.isBanned){
      req.flash('error', 'User has been banned permanently');
      return res.redirect('back');
    }else{
    let user2 = User.findOne({username:req.body.username, banExpires: { $gt: Date.now() }});
    if(!user2){
      req.flash('error', 'User has been banned temporarily');
      return res.redirect('back'); 
    }else{
      next();
    }
  }
  }
}