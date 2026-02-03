const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const app = express();

const router = express.Router();

router.post('/register', require('../controller/userController').registerUser);

router.post('/login', require('../controller/userController').loginUser);
router.post('/logout', require('../controller/userController').logoutUser);
router.get('/profile', authMiddleware, require('../controller/userController').getUserProfile);

module.exports = router;