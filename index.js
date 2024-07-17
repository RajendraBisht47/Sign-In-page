const express=require("express");
const mongoose=require("mongoose");
const User=require("./models/user");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const app=express();
const port=8000;

app.set("view engine","ejs");
app.set("views","views");

app.use(express.urlencoded({extended:false}));
app.use(cookieParser());

mongoose.connect("mongodb://127.0.0.1:27017/users1")


app.get("/",(req,res)=>{
    res.render("login");
})

app.post("/login",async (req,res)=>{
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.send('User not found');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch){

            return res.send('Invalid credentials');
        }

        const token = jwt.sign({ email: req.body.email}, 'your_jwt_secret', { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });


        console.log("password match");
        res.redirect('/home');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
})

app.get("/signin",async (req,res)=>{
    res.render("signin");
})

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.send('User already exists');
        }

        const newUser = new User({ email, password });
        await newUser.save();

        res.send('User created');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

function auth (req, res, next){
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).send('Access Denied: No Token Provided!');
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

app.get("/home",auth,(req,res)=>{
    
    res.render("home",{
        email:req.user.email
    });
})

app.listen(port,()=>{
    console.log(`Server Started at port : ${port} `);
})