const mongoose = require('mongoose');

const arduinoSchema = new mongoose.Schema({
    name: String,
    ip: String,
    mac: String,  // اضافه کردن مک آدرس
    devices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
});

module.exports = mongoose.model('Arduino', arduinoSchema);
