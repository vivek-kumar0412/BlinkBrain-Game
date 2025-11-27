const express = require('express');
const router = express.Router();
const { saveHighScore, health } = require('../controllers/gameController');
const { isAuthenticated } = require('../middleware/auth');

// Protected routes
router.post('/highscore', isAuthenticated, saveHighScore);

// Public route
router.get('/health', health);

module.exports = router;
