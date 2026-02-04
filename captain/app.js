const express=require('express');
require('dotenv').config();

const app=express();
const captainRoutes=require('./routes/captainRoutes');
const cookieParser=require('cookie-parser');
const connectDB = require('./db/db');
connectDB();
const rabbitMq=require('./services/rabbit');
rabbitMq.connectRabbitMQ();

app.use(express.json());
app.use(cookieParser());



app.use('/',captainRoutes);

module.exports=app;