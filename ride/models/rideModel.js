const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    captainId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    pickup: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    fare: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('Ride', rideSchema);
