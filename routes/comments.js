const express = require("express");
const router  = express.Router({mergeParams: true});
const Course = require("../models/course");
const User = require("../models/user");
const Notification = require("../models/notification");
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
        Comment.create(req.body.comment,async function(err, comment){
           if(err){
               console.log(err);
           } else {
               let user = User.findById(course.author.id).exec();
               let newNotification = {
                username: req.user.username,
                courseId: course.id,
                message: "created a new comment"
              }
              let notification = await Notification.create(newNotification);
              await user.notifications.push(notification);
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
       let course = Course.findById(req.params.id).exec();
       let user =  User.findById(course.author.id).exec();
       let newNotification = {
        username: req.user.username,
        courseId: course.id,
        message: "edited a comment"
       }
       let notification = await Notification.create(newNotification);
       await user.notifications.push(notification);
       await user.save();
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
      let user = User.findById(course.author.id).exec();
      let newNotification = {
        username: req.user.username,
        courseId: course.id,
        message: "deleted a comment"
       }
       let notification = await Notification.create(newNotification);
       await user.notifications.push(notification);
       await user.save();
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
    let comment = Comment.findById(req.params.commentId).exec();
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

module.exports = router;