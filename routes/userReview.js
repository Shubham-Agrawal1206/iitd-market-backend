var express = require("express");
var router = express.Router({ mergeParams: true });
var Review = require("../models/review");
var User = require("../models/user");
var Notification = require("../models/notification");
var middleware = require("../middleware");

// Reviews Index
router.get("/", (req, res) => {
    User.findById(req.params.id).populate({
        path: "reviews",
        options: { sort: { createdAt: -1 } } // sorting the populated reviews array to show the latest first
    }).exec(function (err, user) {
        if (err || !user) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.status(200).json(user);
    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkUserReviewExistence, async (req, res) => {
    try {
        //lookup course using ID
        let user = await User.findById(req.params.id).populate("reviews").populate('notifs').exec();
        let review = await Review.create(req.body.review);
        //add author username/id and associated course to the review
        review.author = req.user;
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
            message: "created a new review"
        }
        let notification = await Notification.create(newNotification);
        await user.notifs.push(notification);
        await user.save();
        req.flash("success", "Your review has been successfully added.");
        res.send('/users/' + user.slug);
    } catch (err) {
        console.log(err);
        req.flash("error", err.message);
        return res.redirect("back");
    }
});

//calculates average 
const calculateAverage = (reviews) => {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach((element) => {
        sum += element.rating;
    });
    return sum / reviews.length;
}

// Reviews Update
router.put("/:review_id", middleware.isLoggedIn, middleware.checkReviewOwnership, async (req, res) => {
    let updatedReview = await Review.findByIdAndUpdate(req.params.review_id, req.body.review, { new: true }).exec();
    let user = await User.findById(req.params.id).exec();
    // recalculate course average
    user.rating = calculateAverage(user.reviews);
    //save changes
    let newNotification = {
        username: req.user.username,
        targetSlug: user.slug,
        message: "updated a review"
    }
    let notification = await Notification.create(newNotification);
    await user.notifications.push(notification);
    await user.save();
    req.flash("success", "Your review was successfully edited.");
    res.send('/users/' + user.id);
});

// Reviews Delete
router.delete("/:review_id", middleware.isAdmin, async (req, res) => {
    await Review.findByIdAndRemove(req.params.review_id).exec();
    let user = await User.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.review_id } }, { new: true }).populate("reviews").exec();
    // recalculate course average
    user.rating = calculateAverage(user.reviews);
    let newNotification = {
        username: req.user.username,
        targetSlug: user.slug,
        isCourse: false,
        message: "deleted a review"
    }
    let notification = await Notification.create(newNotification);
    await user.notifications.push(notification);
    await user.save();
    req.flash("success", "Your review was deleted successfully.");
    res.send("/users/" + req.params.id);
});

router.put("/:review_id/report", middleware.isLoggedIn, async (req, res) => {
    try {
        let review = await Review.findById(req.params.review_id).exec();
        review.isReported = true;
        await review.save();
        req.flash('success', 'Review reported!');
        res.send("/users/" + req.params.id);
    } catch (err) {
        console.log(err);
        req.flash('error', err.message);
        return res.redirect('/');
    }
})

router.put("/:review_id/resolve", middleware.isAdmin, async (req, res) => {
    try {
        let review = await Review.findById(req.params.review_id).exec();
        review.isReported = false;
        await review.save();
        req.flash('success', 'Review resolved!');
        res.redirect("/report");
    } catch (err) {
        console.log(err);
        req.flash('error', err.message);
        return res.redirect('/report');
    }
})

router.put("/:review_id/upvote", middleware.isLoggedIn, async (req, res) => {
    try {
        let review = await Review.findById(req.params.review_id).exec();
        if (review.upvoted(req.user.id)) {
            await review.unvote(req.user.id)
            await review.save();
            res.status(200).send();
        } else if (review.downvoted(req.user.id)) {
            await review.unvote(req.user.id)
            await review.save();
            await review.upvote(req.user.id)
            await review.save();
            res.status(200).send();
        } else {
            await review.upvote(req.user.id);
            await review.save();
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("/");
    }
})

router.put("/:review_id/downvote", middleware.isLoggedIn, async (req, res) => {
    try {
        let review = await Review.findById(req.params.review_id).exec();
        if (review.downvoted(req.user.id)) {
            await review.unvote(req.user.id)
            await review.save()
            res.status(200).send();
        } else if (review.upvoted(req.user.id)) {
            await review.unvote(req.user.id)
            await review.save();
            await review.downvote(req.user.id);
            await review.save()
            res.status(200).send();
        } else {
            await review.downvote(req.user.id);
            await review.save()
            res.status(200).send();
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("/");
    }
})


router.get("/:review_id/votes", async (req, res) => {
    let review = await Review.findById(req.params.review_id).exec();
    res.status(200).json(review.upvotes() - review.downvotes());
})

module.exports = router;