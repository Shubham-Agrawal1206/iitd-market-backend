var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Item = require("../models/item");
var Chat = require('../models/chat');
var Review = require("../models/review");
var Notification = require("../models/notification");
var middleware = require("../middleware");

//User Profile
router.get("/:id", async (req, res) => {
  let foundUser = await User.findById(req.params.id).populate('reviews').populate({
    path: 'chats',
    match: { $and: [{ active: true }, { $or: [{ user1: req.params.id }, { user2: req.params.id }] }] }
  }).exec();
  let foundItem = await Item.find({ $and: [{ seller: req.params.id }, { userIsAnonymous: true }] }).exec();
  if ( req.user || req.user.id !== req.params.id) {
    await foundUser.depopulate('chats').execPopulate();
  }
  res.json({ user: foundUser, item: foundItem });
})

router.put("/:id/ban", middleware.isAdmin, async (req, res) => {
  try {
    let user = await User.findById(req.params.id).exec();
    if (!user.isAdmin) {
      user.isBanned = true;
    }
    await user.save();
    res.send();
  } catch (err) {
    console.log(err);
    req.flash('error', err.message);
    return res.redirect('back');
  }
})

router.put("/:id/ban/temp", middleware.isAdmin, async function (req, res) {
  try {
    let user = await User.findById(req.params.id).exec();
    if (!user.isAdmin) {
      user.banExpires = Date.now() + 3600000 * 24 * Number(req.body.day);
    }
    await user.save();
    res.send("back");
  } catch (err) {
    console.log(err);
    req.flash('error', err.message);
    return res.redirect('back');
  }
})

module.exports = router;