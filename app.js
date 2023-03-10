//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
// let myPasswordHash = "";
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));


app.use(session({
    secret: "ms dhoni is the best finisher of all time",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.set("strictQuery", false);

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// var secretCode = process.env.SECRET_CODE;
// userSchema.plugin(encrypt, {secret: secretCode, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    userProfileURL: "http://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login", {errMsg: ""});
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get('/auth/google',
      passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
});

app.get("/secrets", function(req, res){
    User.find({secret: {$ne: null}}, function(err, foundUsers){
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
    });
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

app.get("/submit", function(req, res){
    if (req.isAuthenticated()) {
        res.render("submit"); //
      } else {
        res.redirect("/"); 
      }
});



app.post("/submit", function(req, res){
    
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});


app.post("/register", function(req, res){


    // *********************** Used level - 6 Third party Authentication here ************ //


    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
            
        }
    });


    // ********************* Used level - 4 Authentication here ************************** //



    // bcrypt.genSalt(saltRounds, function(err, salt){
    //     bcrypt.hash(req.body.password, salt, function(err, hash){
    //         if (!err) {
    //             myPasswordHash = hash;
    //         } else {
    //             console.log(err);
    //         }
    //     });
    // });

    // const user = new User({
    //     email: req.body.username,
    //     password: myPasswordHash
    // });

    

    // User.findOne({email: req.body.username}, function(err, users){
    //     if (!err) {
    //         if (!users) {
    //             user.save();
    //             res.render("secrets");
    //         } else {
    //             console.log("user already exist");
    //             res.redirect("/");
    //         }
    //     } else {
    //         console.log(err);
    //     }
    // });

});

//let count = 0;

app.post("/login", function(req, res){

    
    // *********************** Used level - 6 Third party Authentication here ************ //    


    const user = new User ({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });



    // ********************* Used level - 4 Authentication here ************************** //


    // User.findOne({email: username}, function(err, user){
    //     if (!err) {
    //         if (!user) {
    //             count++;
    //             res.render("login", {errMsg: "username or password is wrong "+count});
    //         } else {

    //             bcrypt.compare(password, myPasswordHash, function(err, result){
    //                 if (result){
    //                     res.render("secrets");
    //                 } else {
    //                     count++;
    //                     res.render("login", {errMsg: "username or password is wrong "+count});
    //                 }
    //             }); 
    //         }
    //     }
    // });

});



app.listen("3000", function(){
    console.log("Server is started on port: 3000...for Authentication and security");
})
