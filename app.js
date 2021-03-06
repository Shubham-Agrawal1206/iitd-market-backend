require('dotenv').config();

var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    passport    = require("passport"),
    cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    flash        = require("connect-flash"),
    Item  = require("./models/item"),
    User        = require("./models/user"),
    session = require("express-session"),
    methodOverride = require("method-override"),
    MongoStore = require("connect-mongo")(require("express-session"));
require("./models/notification");
//requiring routes
var itemRoutes = require("./routes/item"),
    indexRoutes      = require("./routes/index"),
    userReviewRoutes = require("./routes/userReview"),
    userRoutes = require("./routes/users");

    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);
    
// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;

const databaseUri = process.env.MONGODB_URI || 'mongodb://localhost/iitd';

mongoose.connect(databaseUri)
      .then(() => console.log(`Database connected`))
      .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(bodyParser.urlencoded({extended: true}));
app.set('trust proxy',1);
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));
//require moment
app.locals.moment = require('moment');


// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Random Words have power!",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      url:process.env.MONGODB_URI || 'mongodb://localhost/iitd'
    })
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req, res, next){
   res.locals.currentUser = req.user;
   if(req.user) {
    try {
      let user = await User.findById(req.user._id).populate('notifs', null, { isRead: false }).exec();
      res.locals.notifications = user.notifs.reverse();
    } catch(err) {
      console.log(err.message);
    }
   }
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});


app.use("/", indexRoutes);
app.use("/item", itemRoutes);
app.use("/users", userRoutes);
app.use("/users/:id/reviews", userReviewRoutes);

app.listen(process.env.PORT,process.env.IP, function(){
   console.log("The Server Has Started!");
});