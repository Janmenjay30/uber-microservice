const rideModel = require('../models/rideModel');

module.exports.createRide = async (req, res) => {
    try {
        const { pickup, destination, fare } = req.body;
        const userId = req.user._id;

        if (!pickup || !destination || !fare) {
            return res.status(400).json({ message: 'Pickup, destination, and fare are required' });
        }

        const newRide = new rideModel({
            userId,
            pickup,
            destination,
            fare,
            status: 'pending'
        });

        await newRide.save();
        res.status(201).json({ message: 'Ride created successfully', ride: newRide });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports.getRides = async (req, res) => {
    try {
        const rides = await rideModel.find();
        res.status(200).json({ rides });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getRideById = async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await rideModel.findById(id);
        
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        
        res.status(200).json({ ride });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.updateRideStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, captainId } = req.body;

        const validStatuses = ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const updateData = { status };
        if (captainId) updateData.captainId = captainId;
        if (status === 'completed') updateData.completedAt = Date.now();

        const ride = await rideModel.findByIdAndUpdate(id, updateData, { new: true });
        
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        
        res.status(200).json({ message: 'Ride updated successfully', ride });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.deleteRide = async (req, res) => {
    try {
        const { id } = req.params;
        const ride = await rideModel.findByIdAndDelete(id);
        
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        
        res.status(200).json({ message: 'Ride deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getUserRides = async (req, res) => {
    try {
        const userId = req.user._id;
        const rides = await rideModel.find({ userId });
        res.status(200).json({ rides });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports.getCaptainRides = async (req, res) => {
    try {
        const { captainId } = req.params;
        const rides = await rideModel.find({ captainId });
        res.status(200).json({ rides });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
