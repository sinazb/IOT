const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const { addDevice, getDevices, deleteDevice } = require('../controllers/deviceController');

// اضافه‌کردن دستگاه
router.post('/add', authenticate, addDevice);

// دریافت لیست دستگاه‌های کاربر
router.get('/', authenticate, getDevices);

// حذف دستگاه
router.delete('/:id', authenticate, deleteDevice);

module.exports = router;
