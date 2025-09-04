const express = require('express');
const router = express.Router();
const { getDeviceTypes } = require('../controllers/deviceTypeController');

// این route عمومی هست و نیاز به احراز هویت نداره
router.get('/', getDeviceTypes);

module.exports = router;
