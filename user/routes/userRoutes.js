const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const app = express();

const router = express.Router();

router.post('/register', require('../controller/userController').registerUser);

router.post('/login', require('../controller/userController').loginUser);
router.post('/logout', require('../controller/userController').logoutUser);
router.get('/profile', authMiddleware, require('../controller/userController').getUserProfile);

// For inter-service communication
router.get('/user/:userId', authMiddleware, require('../controller/userController').getUserById);

module.exports = router;