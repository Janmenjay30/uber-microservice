const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const app = express();

const router = express.Router();

router.post('/register', require('../controller/captainController').registerCaptain);

router.post('/login', require('../controller/captainController').loginCaptain);
router.post('/logout', require('../controller/captainController').logoutCaptain);
router.get('/profile', authMiddleware, require('../controller/captainController').getCaptainProfile);
router.put('/toggle-availability', authMiddleware, require('../controller/captainController').toggleAvailability);



module.exports = router;