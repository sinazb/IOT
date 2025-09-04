const mongoose = require('mongoose');

const PinSchema = new mongoose.Schema({
  name: String,   // مثلاً "out" یا "vcc"
  pin: String     // مثلاً "A0" یا "D4"
});

const DeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceType: {
    type: String,
    enum: ['light', 'lm35', 'buzzer', 'DHT11', 'stepper', 'relay'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  pins: [PinSchema] // لیستی از پین‌ها با اسم و شماره پین
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
