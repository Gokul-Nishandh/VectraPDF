const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

// API End points
///auth/signup - User signup
///auth/login - User login

module.exports = router;
