const express = require('express');

const app = express();
const rideRoutes = require('./routes/rideRoutes');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const connectDB = require('./db/db');
connectDB();
const rabbitMq=require('./services/rabbit');
rabbitMq.connectRabbitMQ();

app.use(express.json());
app.use(cookieParser());

app.use('/', rideRoutes);

module.exports = app;
