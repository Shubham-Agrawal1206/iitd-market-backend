const express = require("express");
const router  = express.Router({mergeParams: true});
const Course = require("../models/course");
const User = require("../models/user");
const Notification = require("../models/notification");
const Activity = require("../models/activity");
const Comment = require("../models/comment");
const middleware = require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find campground by id
    console.log(req.params.id);
    Course.findById(req.params.id, function(err, course){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {course});
        }
    })
});

//Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
   //lookup campground using ID
   Course.findById(req.params.id, function(err, course){
       if(err){
           console.log(err);
           res.redirect("/course");
       } else {
        req.body.comment.course = course; 
        Comment.create(req.body.comment,async function(err, comment){
           if(err){
               console.log(err);
           } else {
               let user = await User.findById(course.author.id).exec();
               let newNotification = {
                username: req.user.username,
                targetId: course.id,
                isCourse: true,
                message: "created a new comment"
              }
              let newActivity = {
                username: req.user.username,
                targetId: course.id,
                isCourse: true,
                message: "created a new comment"
              }
              let activity = await Activity.create(newActivity);
              let notification = await Notification.create(newNotification);
              await user.notifications.push(notification);
              await user.notifications.push(activity);
              await user.save();
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               await comment.save();
               await course.comments.push(comment);
               await course.save();
               req.flash('success', 'Created a comment!');
               return res.redirect('/course/' + course._id);
           }
        });
       }
   });
});

router.get("/:commentId/edit", middleware.isLoggedIn, middleware.checkUserComment, function(req, res){
  res.render("comments/edit", {course_id: req.params.id, comment: req.comment});
});

router.put("/:commentId", middleware.isLoggedIn, middleware.checkUserComment, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment,async function(err, comment){
     try{
       let course = await Course.findById(req.params.id).exec();
       let user = await User.findById(course.author.id).exec();
       let newNotification = {
        username: req.user.username,
        targetId: course.id,
        isCourse: true,
        message: "edited a comment"
       }
       let notification = await Notification.create(newNotification);
       await user.notifications.push(notification);
       await user.save();
       let userb = await User.findById(req.user.id).exec();
       let newActivity = {
        username: req.user.username,
        targetId: course.id,
        isCourse: true,
        message: "edited a comment"
       }
       let activity = await Activity.create(newActivity);
       await userb.activity.push(activity);
       await userb.save();
       res.redirect("/course/" + req.params.id);
     }catch(err){
      console.log(err)
      req.flash('error', err.message);
      return res.redirect('/');
     }
   }); 
});

router.delete("/:commentId", middleware.isLoggedIn, middleware.checkUserComment, function(req, res){
  // find campground, remove comment from comments array, delete comment in db
  Course.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, async function(err,course) {
    try{
      let user = await User.findById(course.author.id).exec();
      let newNotification = {
        username: req.user.username,
        targetId: course.id,
        isCourse: true,
        message: "deleted a comment"
       }
       let notification = await Notification.create(newNotification);
       await user.notifications.push(notification);
       await user.save();
       let userb = await User.findById(req.user.id).exec();
       let newActivity = {
        username: req.user.username,
        targetId: course.id,
        isCourse: true,
        message: "deleted a comment"
       }
       let activity = await Activity.create(newActivity);
       await userb.activity.push(activity);
       await userb.save();
       await req.comment.remove();
       req.flash('error', 'Comment deleted!');
       res.redirect("/course/" + req.params.id);
    }catch(err){
      console.log(err)
      req.flash('error', err.message);
      return res.redirect('/');
    }
  });
});

router.put("/:commentId/report", middleware.isLoggedIn,async function(req,res){
  try{
    let comment = await Comment.findById(req.params.commentId).exec();
    comment.isReported = true;
    await comment.save();
    req.flash('success', 'Comment reported!');
    res.redirect("/course/" + req.params.id);
  }catch(err){
    console.log(err)
    req.flash('error', err.message);
    return res.redirect('/');
  }
})

router.put("/:commentId/resolve",middleware.isAdmin,async function(req,res){
  try{
      let comment = await Comment.findById(req.params.commentId).exec();
      comment.isReported = false;
      await commnet.save();
      req.flash('success', 'Comment resolved!');
      res.redirect("/report");
  }catch(err){
      console.log(err);
      req.flash('error', err.message);
      return res.redirect('/report');
  }
})

module.exports = router;