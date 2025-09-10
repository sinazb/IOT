const express = require('express');
const {
  sendCommand,
  getCommands,
  receiveSensorData,
  ping
} = require('../controllers/arduinoController');

module.exports = (io) => {
  const router = express.Router();

  // آردوینو فرمان می‌گیرد
  router.get('/commands', (req, res) => getCommands(req, res));

  // داشبورد فرمان می‌فرستد
  router.post('/send-command', (req, res) => {
    console.log("📥 Command received at /api/arduino/send-command");
    console.log("👤 User:", req.user ? req.user.id : "Unknown");
    console.log("📋 Headers:", req.headers);
    console.log("📦 Body:", req.body);

    const { mac, command } = req.body;
    if (!mac || !command) {
      console.log("❌ Missing MAC or command in request");
      return res.status(400).json({ success: false, message: 'MAC یا command خالی است' });
    }

    console.log("✅ Valid request received");
    console.log("📡 MAC:", mac);
    console.log("⚡ Command:", command);

    sendCommand(req, res, io);
  });

  // آردوینو دیتا می‌فرستد
  router.post('/data', (req, res) => receiveSensorData(req, res, io));

  router.get('/ping', ping);

  return router;
};
