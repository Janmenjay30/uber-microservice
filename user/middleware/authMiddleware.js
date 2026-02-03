const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
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

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const user = await userModel.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Authentication failed', error: err.message });
    }
}

module.exports = authMiddleware;


