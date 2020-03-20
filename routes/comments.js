const express = require("express");
const router  = express.Router({mergeParams: true});
const Course = require("../models/coure");
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

router.put("/:commentId", middleware.isAdmin, function(req, res){
   Comment.findByIdAndUpdate(req.params.commentId, req.body.comment, function(err, comment){
       if(err){
          console.log(err);
           res.render("edit");
       } else {
           res.redirect("/course/" + req.params.id);
       }
   }); 
});

router.delete("/:commentId", middleware.isLoggedIn, middleware.checkUserComment, function(req, res){
  // find campground, remove comment from comments array, delete comment in db
  Course.findByIdAndUpdate(req.params.id, {
    $pull: {
      comments: req.comment.id
    }
  }, function(err) {
    if(err){ 
        console.log(err)
        req.flash('error', err.message);
        res.redirect('/');
    } else {
        req.comment.remove(function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('/');
          }
          req.flash('error', 'Comment deleted!');
          res.redirect("/course/" + req.params.id);
        });
    }
  });
});

module.exports = router;