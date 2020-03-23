var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Course = require("../models/course");
var Comment = require("../models/comment");
var Review = require("../models/review");
var Activity = require("../models/activity");
var Notification = require("../models/notification");
var pathx = require("path");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
var middleware = require("../middleware");

//User Profile
router.get("/:id",function(req,res){
    User.findById(req.params.id).populate('followers').populate('reviews').exec(function(err,foundUser){
        if(err){
            req.flash("error","Something went wrong");
            return res.redirect("/");
        }
        Course.find().where('author.id').equals(foundUser._id).exec(async function(err,foundCourse){
        if(err){
            req.flash("error","Something went wrong");
            return res.redirect("/");
        }
        if(req.user){
        let userb = await User.findById(req.user.id).exec();
        let newActivity = {
            username: req.user.username,
            targetId: req.params.id,
            isCourse: false,
            message: "visited user: " + foundUser.username
        }
        let activity = await Activity.create(newActivity);
        await userb.activity.push(activity);
        await userb.save();
        res.render("users/show",{user:foundUser,course:foundCourse});
      }else{
        res.render("users/show",{user:foundUser,course:foundCourse});
      }   
        })   
    })
})

router.put("/:id/ban",middleware.isAdmin,async function(req,res){
    try{
      let user = await User.findById(req.params.id).exec();
      if(!user.isAdmin){
        user.isBanned = true;
      }
      await user.save();
      if(!user.isAdmin){
        let smtpTransport = await nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'emailxx365@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        let mailOptions = {
          to: user.email,
          from: 'emailxx365@gmail.com',
          subject: 'User Banned',
          text: 'You are receiving this because you have banned for the rest of the life for your misbehaviour.\n\n' +
          'For resolving the issue, please email us about it.\n'
        };
        await smtpTransport.sendMail(mailOptions);
      }
      res.redirect("back");
    }catch(err){
      console.log(err);
      req.flash('error', err.message);
      return res.redirect('back');
    }
  })
  
  router.put("/:id/ban/temp",middleware.isAdmin,async function(req,res){
    try{
      let user = await User.findById(req.params.id).exec();
      if(!user.isAdmin){
        user.banExpires = Date.now() + 3600000*24*Number(req.body.day);
      }
      await user.save();
      if(!user.isAdmin){
        let smtpTransport = await nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'emailxx365@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        let mailOptions = {
          to: user.email,
          from: 'emailxx365@gmail.com',
          subject: 'User Banned',
          text: 'You are receiving this because you have banned for '+ String(req.body.day) +' days for your misbehaviour.\n\n' +
          'For resolving the issue, please email us about it.\n'
        };
        await smtpTransport.sendMail(mailOptions);
      }
      res.redirect("back");
    }catch(err){
      console.log(err);
      req.flash('error', err.message);
      return res.redirect('back');
    }
  })

// Define escapeRegex function for search feature
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
  
router.get("/",function(req,res){
    if(req.user && req.user.isAdmin){
        if(req.query.search && req.xhr) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            // Get all courses from DB
            User.find({username: regex}, function(err, allUser){
               if(err){
                  console.log(err);
               } else {
                  res.status(200).json(allUser);
               }
            });
        } else {
            // Get all courses from DB
            User.find({}, function(err, allUser){
               if(err){
                   console.log(err);
               } else {
                  if(req.xhr) {
                    res.json(allUser);
                  } else {
                    res.render("users/index",{user: allUser, page: 'users'});
                  }
               }
            });
        }
    }else{
        if(req.query.search && req.xhr) {
            const regex = new RegExp(escapeRegex(req.query.search), 'gi');
            // Get all courses from DB
            User.find({username: regex, isProfessor: true}, function(err, allUser){
               if(err){
                  console.log(err);
               } else {
                  res.status(200).json(allUser);
               }
            });
        } else {
            // Get all courses from DB
            User.find({isProfessor: true}, function(err, allUser){
               if(err){
                   console.log(err);
               } else {
                  if(req.xhr) {
                    res.json(allUser);
                  } else {
                    res.render("users/index",{user: allUser, page: 'users'});
                  }
               }
            });
        }
    }
})

router.get("/:id/activity",middleware.isLoggedIn, middleware.checkUserAct,async function(req,res){
  try{
    let user = await User.findById(req.params.id).populate('activity').exec();
    let activity = await user.activity.reverse();
    let name = user.username;
    res.render("users/activity",{activity,name});
  }catch(err){
    console.log(err);
    req.flash('error',err.message);
    return res.redirect('/users' + req.params.id);
  }
})

// handle activity
router.get('/activity/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let activity = await Activity.findById(req.params.id);
    if(activity.isCourse) {
      res.redirect(`/course/${activity.targetId}`);
    }else{
      res.redirect(`/users/${activity.targetId}`);
    }
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

router.get("/activity/admin",middleware.isLoggedIn,middleware.isAdmin,function(req,res){
  res.render("users/actAdmin");
})

router.post("/activity/admin",middleware.isLoggedIn,middleware.isAdmin,async function(req,res){
  try{
    let user = await User.findOne({username:req.body.username}).exec();
    if(!user){
      req.flash('error', 'No user found');
      return res.redirect('back');
    }else{
      return res.redirect('/users/'+user.id +'activity');
    }
  }catch(err){
    req.flash('error', err.message);
    return res.redirect('back');
  }
})

module.exports = router;