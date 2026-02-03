const express=require('express');

const app=express();
const captainRoutes=require('./routes/captainRoutes');
const cookieParser=require('cookie-parser');
require('dotenv').config();
const connectDB = require('./db/db');
connectDB();

app.use(express.json());
app.use(cookieParser());



app.use('/',captainRoutes);

module.exports=app;