//jshint esversion:6

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

mongoose.set("strictQuery", false);

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

var secretCode = process.env.SECRET_CODE;
userSchema.plugin(encrypt, {secret: secretCode, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);


app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login", {errMsg: ""});
});

app.get("/register", function(req, res){
    res.render("register");
});


app.post("/register", function(req, res){

    const user = new User({
        email: req.body.username,
        password: req.body.password
    });

    User.findOne({email: req.body.username}, function(err, users){
        if (!err) {
            if (!users) {
                user.save();
                res.render("secrets");
            } else {
                console.log("user already exist");
                res.redirect("/");
            }
        } else {
            console.log(err);
        }
    });

});

let count = 0;

app.post("/login", function(req, res){

    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function(err, user){
        if (!err) {
            if (!user) {
                count++;
                res.render("login", {errMsg: "username or password is wrong "+count});
            } else {
                if (password === user.password){
                    res.render("secrets");
                } else {
                    count++;
                    res.render("login", {errMsg: "username or password is wrong "+count});
                }
                
            }
        }
    })

})



app.listen("3000", function(){
    console.log("Server is started on port: 3000...for Authentication and security");
})
