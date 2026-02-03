const captainModel = require('../models/captainModel');

const bcrypt = require('bcrypt');
const blacklistTokenSchema = require('../models/blacklistTokenModel');
const jwt = require('jsonwebtoken');

module.exports.registerCaptain = async (req, res) => {
    try{

        const {name, email, password} = req.body;
        const existingCaptain = await captainModel.findOne({email});
        if(existingCaptain){
            return  res.status(400).json({message: 'Captain already exists'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newCaptain = new captainModel({
            name,
            email,
            password: hashedPassword
        });
        await newCaptain.save();
        const token = jwt.sign({captainId: newCaptain._id},process.env.JWT_SECRET, {expiresIn: '1h'});
        res.cookie('token', token, {httpOnly: true});

        res.status(201).json({message: 'Captain registered successfully','token': token});    

    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }

};

module.exports.loginCaptain = async (req, res) => {
    try{
        const {email, password} = req.body;
        const captain = await captainModel.findOne({email});
        if(!captain){
            return res.status(400).json({message: 'Invalid credentials'});
        }   
        const isMatch = await bcrypt.compare(password, captain.password);
        if(!isMatch){
            return res.status(400).json({message: 'Invalid credentials'});
        }   
        const token = jwt.sign({captainId: captain._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
        res.cookie('token', token, {httpOnly: true});
        res.status(200).json({message: 'Login successful','token': token });

    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }   
};

module.exports.logoutCaptain = (req, res) => {
    try{
        const token = req.cookies.token;
        if(!token){
            return res.status(400).json({message: 'No token found'});
        }
        const blacklistedToken = new blacklistTokenSchema({token});
        blacklistedToken.save();
        res.clearCookie('token');
        res.status(200).json({message: 'Logout successful'});

    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }
    
};

module.exports.getCaptainProfile = async (req, res) => {
    try{
        // req.captain is already populated by authMiddleware with the full captain document (minus password)
        res.status(200).json({captain: req.captain});
    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }
};

module.exports.toggleAvailability = async (req, res) => {
    try{
        const captain = await captainModel.findById(req.captain._id);
        captain.isAvailable = !captain.isAvailable;
        await captain.save();
        res.status(200).json({message: 'Availability status updated', isAvailable: captain.isAvailable});
    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }   
};