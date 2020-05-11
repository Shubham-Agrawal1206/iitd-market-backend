var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Item = require("../models/item");
var Review = require("../models/review");
var Notification = require("../models/notification");
var middleware = require("../middleware");

//handle sign up logic
router.post("/register", middleware.checkRegister, (req, res) => {
  var object = {
    username: req.body.username,
    avatar: req.body.avatar,
    contact_number: req.body.contactNumber,
    entry_number: req.body.entryNumber,
    hostel: req.body.hostel,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    description: req.body.description
  }
  var newUser = new User(object);
  if (req.body.adminCode === process.env.ADMIN_CODE) {
    newUser.isAdmin = true;
  }
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      return res.send(err.message);
    }
    res.send('/register');
  });
});

//handling login logic
router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/item",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome!"
  }), (req, res) => { });

// logout route
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success", "See you later!");
  res.redirect("/item");
});

// follow user
router.get('/follow/:slug', middleware.isLoggedIn, async (req, res) => {
  try {
    console.log(req.user);
    let user = await User.findById(req.user._id).exec();
    await user.folCategory.push(req.params.slug);
    await user.save();
    await req.login(user);
    req.flash('success', 'Successfully followed ' + req.params.slug + '!');
    res.redirect('/users/' + req.user.id);
  } catch (err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

// view all notifications
router.get('/notifications', middleware.isLoggedIn, async (req, res) => {
  try {
    let user = await User.findById(req.user._id).populate({
      path: 'notifs',
      options: { sort: { "_id": -1 } }
    }).exec();
    let allNotifications = user.notifications;
    res.json(allNotifications);
  } catch (err) {
    req.flash('error', err.message);
    return res.redirect('back');
  }
});

router.get("/report", middleware.isAdmin, async (req, res) => {
  try {
    const items = await Item.find({ isReported: true }).exec();
    const reviews = await Review.find({ isReported: true }).exec();
    res.render("report", { items, reviews });
  } catch (err) {
    console.log(err);
    req.flash('error', err.message);
    return res.redirect('back');
  }
})

module.exports = router;