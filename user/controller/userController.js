const userModel = require('../models/userModel');

const bcrypt = require('bcrypt');
const blacklistTokenSchema = require('../models/blacklistTokenModel');
const jwt = require('jsonwebtoken');

module.exports.registerUser = async (req, res) => {
    try{

        const {name, email, password} = req.body;
        const existingUser = await userModel.findOne({email});
        if(existingUser){
            return  res.status(400).json({message: 'User already exists'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });
        await newUser.save();
        const token = jwt.sign({userId: newUser._id},process.env.JWT_SECRET, {expiresIn: '1h'});
        res.cookie('token', token, {httpOnly: true});

        res.status(201).json({message: 'User registered successfully','token': token});    

    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }

};

module.exports.loginUser = async (req, res) => {
    try{
        const {email, password} = req.body;
        const user = await userModel.findOne({email});
        if(!user){
            return res.status(400).json({message: 'Invalid credentials'});
        }   
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: 'Invalid credentials'});
        }   
        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: '1h'});
        res.cookie('token', token, {httpOnly: true});
        res.status(200).json({message: 'Login successful','token': token });

    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }   
};

module.exports.logoutUser = (req, res) => {
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

module.exports.getUserProfile = async (req, res) => {
    try{
        // req.user is already populated by authMiddleware with the full user document (minus password)
        res.status(200).json({user: req.user});
    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }
};

module.exports.getUserById = async (req, res) => {
    try{
        const { userId } = req.params;
        const user = await userModel.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ user });
    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }
};