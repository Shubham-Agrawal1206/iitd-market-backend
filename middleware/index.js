var Item = require('../models/item');
var Review = require("../models/review");
var User = require("../models/user");

module.exports = {
  isLoggedIn: async (req, res, next) => {
    if (req.isAuthenticated()) {
      if (!req.user.isBanned) {
        if (req.user.banExpires && req.user.banExpires > Date.now()) {
          req.flash('error', 'User has been banned temporarily');
          return res.status(500).send('/course');
        } else {
          return next();
        }
      } else {
        req.flash('error', 'User has been banned permanently');
        return res.status(500).send('/course');
      }
    }
    req.flash('error', 'You must be signed in to do that!');
    res.status(500).send("/login");
  },
  checkUserItem: (req, res, next) => {
    Item.findById(req.params.id).exec(async (err, foundItem) => {
      if (err || !foundItem) {
        console.log(err);
        req.flash('error', 'Sorry, that course does not exist!');
        res.status(500).send('/item');
      } else if (foundItem.seller === req.user.id || req.user.isAdmin) {
        req.item = await foundItem.populate('chats').execPopulate();
        next();
      } else {
        req.flash('error', 'You don\'t have permission to do that!');
        res.status(500).send('/item/' + req.params.id);
      }
    });
  },
  isAdmin: (req, res, next) => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      req.flash('error', 'This site is now read only thanks to spam and trolls.');
      res.status(500).send('/item');
    }
  },
  checkReviewOwnership: (req, res, next) => {
    if (req.isAuthenticated()) {
      Review.findById(req.params.review_id, (err, foundReview) => {
        if (err || !foundReview) {
          res.status(500).send("back");
        } else {
          // does user own the comment?
          if (foundReview.author === req.user.id || req.user.isAdmin) {
            next();
          } else {
            req.flash("error", "You don't have permission to do that");
            res.status(500).send("back");
          }
        }
      });
    } else {
      req.flash("error", "You need to be logged in to do that");
      res.status(500).send("back");
    }
  },
  checkUserReviewExistence: (req, res, next) => {
    if (req.isAuthenticated()) {
      User.findById(req.params.id).populate("reviews").exec((err, foundUser) => {
        if (err || !foundUser) {
          req.flash("error", "User not found.");
          res.status(500).send("back");
        } else {
          // check if req.user._id exists in foundCourse.reviews
          var foundUserReview = foundUser.reviews.some((review) => review.author === req.user.id);
          if (foundUserReview) {
            req.flash("error", "You already wrote a review.");
            return res.status(500).send("/users/" + foundUser.id);
          }
          // if the review was not found, go to the next middleware
          next();
        }
      });
    } else {
      req.flash("error", "You need to login first.");
      res.status(500).send("back");
    }
  },
  checkRegister: async (req, res, next) => {
    var exp = /iitd\.ac\.in$/gm
    if (!exp.test(req.body.email)) {
      next()
    } else {
      var kebid = /^(\w+)/gm
      kebid.lastIndex = 0
      var result = kebid.exec(req.body.email)
      let user = await User.findOne({ email: { $regex: `^${result[0]}`, $options: 'gm' } }).exec()
      if (user) {
        req.flash('error', 'You are already registered with email ' + user.email);
        return res.redirect('/register');
      } else {
        next()
      }
    }
  }
}