var express = require("express");
var router = express.Router({mergeParams: true});
var Course = require("../models/course");
var Review = require("../models/review");
var Activity = require("../models/activity");
var User = require("../models/user");
var Notification = require("../models/notification");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    User.findOne({slug:req.params.slug}).populate({
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
router.get("/new", middleware.isLoggedIn, middleware.checkUserReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the course, only one review per user is allowed
    User.findOne({slug:req.params.slug}, function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("userReviews/new", {user: user});
    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkUserReviewExistence, function (req, res) {
    //lookup course using ID
    User.findOne({slug:req.params.slug}).populate("reviews").populate('notifications').exec(function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review,async function (err, review) {
            try{
                //add author username/id and associated course to the review
            review.author.slug = req.user.slug;
            review.author.username = req.user.username;
            review.user = user;
            //save review
            await review.save();
            await user.reviews.push(review);
            // calculate the new average review for the course
            user.rating = await calculateAverage(user.reviews);
            //save course
            let newNotification = {
                username: req.user.username,
                targetSlug: user.slug,
                isCourse: false,
                message: "created a new review"
            }
            let notification = await Notification.create(newNotification);
            await user.notifications.push(notification);
            let activity = await Activity.create(newNotification);
            await user.activity.push(activity);
            await user.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/users/' + user.slug);

            }catch(err){
                console.log(err);
                req.flash("error", err.message);
                return res.redirect("back");
            }   
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
        res.render("userReviews/edit", {user_slug: req.params.slug, review: foundReview});
    });
});

// Reviews Update
router.put("/:review_id", middleware.isLoggedIn, middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        User.findOne({slug:req.params.slug}).populate("reviews").populate('notifications').exec(async function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate course average
            user.rating = calculateAverage(user.reviews);
            //save changes
            let newNotification = {
                username: req.user.username,
                targetSlug: user.slug,
                isCourse: false,
                message: "updated a review"
            }
            let notification = await Notification.create(newNotification);
            await user.notifications.push(notification);
            await user.save();
            let userb = await User.findById(req.user.id).exec();
            let activity = await Activity.create(newNotification);
            await userb.activity.push(activity);
            await userb.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/users/' + user.slug);
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
        User.findOneAndUpdate({slug:req.params.slug}, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").populate('notifications').exec(async function (err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate course average
            user.rating = calculateAverage(user.reviews);
            //save changes
            let newNotification = {
                username: req.user.username,
                targetSlug: user.slug,
                isCourse: false,
                message: "deleted a review"
            }
            let notification = await Notification.create(newNotification);
            await user.notifications.push(notification);
            await user.save();
            let userb = await User.findById(req.user.id).exec();
            let activity = await Activity.create(newNotification);
            await userb.activity.push(activity);
            await userb.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/users/" + req.params.slug);
        });
    });
});

router.put("/:review_id/report",middleware.isLoggedIn,async function(req,res){
    try{
        let review = await Review.findById(req.params.review_id).exec();
        review.isReported = true;
        await review.save();
        let userb = await User.findById(req.user.id).exec();
        let newActivity = {
            username: req.user.username,
            targetSlug: req.params.slug,
            isCourse: false,
            message: "reported a review"
        }
        let activity = await Activity.create(newActivity);
        await userb.activity.push(activity);
        await userb.save();
        req.flash('success', 'Review reported!');
        res.redirect("/users/" + req.params.slug);
    }catch(err){
        console.log(err);
        req.flash('error', err.message);
        return res.redirect('/');
    }
})

router.put("/:review_id/resolve",middleware.isAdmin,async function(req,res){
    try{
        let review = await Review.findById(req.params.review_id).exec();
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

router.put("/:review_id/upvote",middleware.isLoggedInAjax,async function(req,res){
    try{
    let review = await Review.findById(req.params.review_id).exec();
    if(review.upvoted(req.user.id)){
        await review.unvote(req.user.id)
        await review.save();
        res.status(200).send();
    }else if(review.downvoted(req.user.id)){
        await review.unvote(req.user.id)
        await review.save();
        await review.upvote(req.user.id)
        await review.save();
        res.status(200).send();
    }else{
        await review.upvote(req.user.id);
        await review.save();
        res.status(200).send(); 
    }
}catch(err){
    console.log(err);
    res.status(500).send("/");
}
})

router.put("/:review_id/downvote",middleware.isLoggedInAjax,async function(req,res){
    try{
    let review = await Review.findById(req.params.review_id).exec();
    if(review.downvoted(req.user.id)){
        await review.unvote(req.user.id)
        await review.save()
        res.status(200).send();
    }else if(review.upvoted(req.user.id)){
        await review.unvote(req.user.id)
        await review.save();
        await review.downvote(req.user.id);
        await review.save()
        res.status(200).send();
    }else{
        await review.downvote(req.user.id);
        await review.save()
        res.status(200).send(); 
    }
}catch(err){
    console.log(err);
    res.status(500).send("/");
}
})


router.get("/:review_id/votes",async function(req,res){
    let review = await Review.findById(req.params.review_id).exec();
    res.status(200).json(review.upvotes() - review.downvotes());
})

module.exports = router;