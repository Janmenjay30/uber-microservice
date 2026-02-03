const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const rideController = require('../controller/rideController');

const router = express.Router();

// Create a new ride (requires user authentication)
router.post('/create', authMiddleware, rideController.createRide);

// Get all rides
router.get('/', rideController.getRides);

// Get user's rides (requires authentication)
router.get('/my-rides', authMiddleware, rideController.getUserRides);

// Get rides by captain ID
router.get('/captain/:captainId', rideController.getCaptainRides);

// Get ride by ID
router.get('/:id', rideController.getRideById);

// Update ride status
router.patch('/:id/status', rideController.updateRideStatus);

// Delete ride
router.delete('/:id', rideController.deleteRide);

module.exports = router;
