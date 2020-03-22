var express = require("express");
var router = express.Router({mergeParams: true});
var Course = require("../models/course");
var Review = require("../models/review");
var User = require("../models/user");
var Notification = require("../models/notification");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    User.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, user) {
        if (err || !user) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("userReviews/index", {user: user});
    });
});

// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the course, only one review per user is allowed
    User.findById(req.params.id, function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("userReviews/new", {user: user});
    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup course using ID
    User.findById(req.params.id).populate("reviews").exec(function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review,async function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated course to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.user = user;
            //save review
            await review.save();
            await user.reviews.push(review);
            // calculate the new average review for the course
            user.rating = await calculateAverage(user.reviews);
            //save course
            await user.save();
            let userx = User.findById(req.params.id).exec();
            let newNotification = {
                username: req.user.username,
                targetId: userx.id,
                isCourse: false,
                message: "created a new review"
            }
            let notification = await Notification.create(newNotification);
            await userx.notifications.push(notification);
            await userx.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/users/' + userx._id);
        });
    });
});

//calculates average 
function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

// Reviews Edit
router.get("/:review_id/edit", middleware.isLoggedIn, middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("userReviews/edit", {user_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/:review_id", middleware.isLoggedIn, middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        User.findById(req.params.id).populate("reviews").exec(async function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate course average
            user.rating = calculateAverage(user.reviews);
            //save changes
            await user.save();
            let userx = User.findById(req.params.id).exec();
            let newNotification = {
                username: req.user.username,
                targetId: userx.id,
                isCourse: false,
                message: "updated a review"
            }
            let notification = await Notification.create(newNotification);
            await userx.notifications.push(notification);
            await userx.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/users/' + userx._id);
        });
    });
});

// Reviews Delete
router.delete("/:review_id", middleware.isLoggedIn, middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        User.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(async function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate course average
            user.rating = calculateAverage(user.reviews);
            //save changes
            await user.save();
            let userx = User.findById(req.params.id).exec();
            let newNotification = {
                username: req.user.username,
                courseId: userx.id,
                message: "updated a review"
            }
            let notification = await Notification.create(newNotification);
            await userx.notifications.push(notification);
            await userx.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/users/" + req.params.id);
        });
    });
});

router.put("/:review_id/report",middleware.isLoggedIn,async function(req,res){
    try{
        let review = Review.findById(review_id).exec();
        review.isReported = true;
        await review.save();
        req.flash('success', 'Review reported!');
        res.redirect("/users/" + req.params.id);
    }catch(err){
        console.log(err);
        req.flash('error', err.message);
        return res.redirect('/');
    }
})

router.put("/:review_id/resolve",middleware.isAdmin,async function(req,res){
    try{
        let review = Review.findById(req.params.review_id).exec();
        review.isReported = false;
        await review.save();
        req.flash('success', 'Review resolved!');
        res.redirect("/report");
    }catch(err){
        console.log(err);
        req.flash('error', err.message);
        return res.redirect('/report');
    }
})

module.exports = router;