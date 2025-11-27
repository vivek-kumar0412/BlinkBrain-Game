const express = require('express');
const router = express.Router();
const { register, login, logout, getCurrentUser, checkEmail } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/check-email', checkEmail);

// Protected routes
router.post('/logout', logout);
router.get('/me', isAuthenticated, getCurrentUser);

module.exports = router;
