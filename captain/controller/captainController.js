const captainModel = require('../models/captainModel');

const bcrypt = require('bcrypt');
const blacklistTokenSchema = require('../models/blacklistTokenModel');
const jwt = require('jsonwebtoken');
const {subscribeToExchange, publishToExchange} = require('../services/rabbit');
const axios = require('axios');
const pendingRequests = [];

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


module.exports.waitForNewRide=async(req,res)=>{
    try{
        req.setTimeout(30000, () => {
            
            res.status(204).end(); // No Content
        });
        pendingRequests.push(res);
        // res.status(200).json({message: 'Subscribed to new ride notifications'});
    }
    catch(error){
        res.status(500).json({message: 'Server error'});
    }   
};

module.exports.acceptRide = async (req, res) => {
    try {
        const { rideId } = req.body;
        const captainId = req.captain._id;

        if (!rideId) {
            return res.status(400).json({ message: 'Ride ID is required' });
        }

        // Check if captain is available
        const captain = await captainModel.findById(captainId);
        if (!captain.isAvailable) {
            return res.status(403).json({ message: 'Captain is not available' });
        }

        // Update ride status in ride service
        try {
            const rideServiceUrl = process.env.RIDE_SERVICE_URL || 'http://localhost:3003';
            const response = await axios.patch(
                `${rideServiceUrl}/${rideId}/status`,
                {
                    status: 'accepted',
                    captainId: captainId
                }
            );

            // Publish ride accepted event to notify user service
            await publishToExchange('ride_updates', 'ride.accepted', {
                rideId: rideId,
                captainId: captainId,
                captainName: captain.name,
                status: 'accepted',
                acceptedAt: new Date()
            });

            res.status(200).json({ 
                message: 'Ride accepted successfully', 
                ride: response.data.ride 
            });
        } catch (error) {
            console.error('Error updating ride:', error.message);
            return res.status(500).json({ 
                message: 'Failed to accept ride', 
                error: error.response?.data?.message || error.message 
            });
        }
    } catch (error) {
        console.error('Error in acceptRide:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


subscribeToExchange("new_ride", "captain-new-rides", "ride.created", (data) => {
    // data is already parsed by rabbit.js, no need to JSON.parse again
    pendingRequests.forEach((res) => {
        res.status(200).json({message: 'New ride available', ride: data});
    });
    pendingRequests.length = 0; // Clear the array
    console.log("New ride received in captain service:", data);
});