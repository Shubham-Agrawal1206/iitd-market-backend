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

//root route
router.get("/", function(req, res){
    res.sendFile(pathx.join(__dirname+'/../views/landing'+'/index.html'));
});

// show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username,avatar: req.body.avatar,firstName:req.body.firstName,lastName:req.body.lastName,email:req.body.email});
    if(req.body.adminCode === process.env.ADMIN_CODE) {
      newUser.isAdmin = true;
    }
    if(req.body.profCode === process.env.PROF_CODE){
      newUser.isProfessor = true;
    }
    User.register(newUser, req.body.password,async function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        let newActivity = {
          username: user.username,
          targetId: user.id,
          isCourse: false,
          message: "registered"
        }
        let activity = await Activity.create(newActivity);
        await user.activity.push(activity);
        await user.save();
        await passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/course"); 
        });
    });
});

//show login form
router.get("/login", function(req, res){
   res.render("login", {page: 'login'}); 
});

//handling login logic
router.post("/login",middleware.checkUser, passport.authenticate("local", 
    {
        successRedirect: "/course",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: "Welcome to Goin'Campin'!"
    }),async function(req, res){
      let user = await User.findById(req.user.id).exec();
      let newActivity = {
        username: user.username,
        targetId: user.id,
        isCourse: false,
        message: "login"
      }
      let activity = await Activity.create(newActivity);
      await user.activity.push(activity);
      await user.save();
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "See you later!");
   res.redirect("/course");
});

//forget pasword route
router.get("/forgot",function(req,res){
    res.render("forgot");
}); 


router.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'emailxx365@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'emailxx365@gmail.com',
          subject: 'Node.js Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });
  
router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
});
  
router.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            user.setPassword(req.body.password, function(err) {
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                  done(err, user);
                });
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'emailxx365@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'emailxx365@mail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/course');
    });
});
  
// follow user
router.get('/follow/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.params.id);
    await user.followers.push(req.user._id);
    await user.save();
    req.flash('success', 'Successfully followed ' + user.username + '!');
    res.redirect('/users/' + req.params.id);
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

// view all notifications
router.get('/notifications', middleware.isLoggedIn, async function(req, res) {
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifications',
      options: { sort: { "_id": -1 } }
    }).exec();
    let allNotifications = user.notifications;
    res.render('notifications/index', { allNotifications });
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

// handle notification
router.get('/notifications/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    await notification.save();
    if(notification.isCourse) {
      res.redirect(`/course/${notification.targetId}`);
    }else{
      res.redirect(`/users/${notification.targetId}`);
    }
  } catch(err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

router.get("/report",middleware.isAdmin,async function(req,res){
  try{
    const comments = await Comment.find({isReported:true}).exec();
    const reviews = await Review.find({isReported:true}).exec();
    console.log(comments,reviews);
    res.render("report",{comments,reviews});
  }catch(err){
    console.log(err);
    req.flash('error', err.message);
    return res.redirect('back');
  }
})

module.exports = router;