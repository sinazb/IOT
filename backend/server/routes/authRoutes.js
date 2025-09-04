const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// ثبت‌نام
router.post('/register', register);

// ورود
router.post('/login', login);

module.exports = router;
