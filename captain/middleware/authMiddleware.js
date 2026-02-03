const jwt = require('jsonwebtoken');
const captainModel = require('../models/captainModel');
const blacklistTokenModel = require('../models/blacklistTokenModel');

async function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

        if (!token) {
            return res.status(401).json({ message: 'Not authorized, token missing' });
        }

        const isBlacklisted = await blacklistTokenModel.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: 'Token has been blacklisted, please login again' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'JWT secret not configured on server' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.captainId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const captain = await captainModel.findById(decoded.captainId).select('-password');
        if (!captain) {
            return res.status(401).json({ message: 'Captain not found' });
        }

        req.captain = captain;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Authentication failed', error: err.message });
    }
}

module.exports = authMiddleware;


