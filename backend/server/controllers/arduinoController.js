// صف دستورها برای هر MAC
const commandQueues = new Map();

// افزودن به صف
function enqueueCommand(mac, command) {
  if (!commandQueues.has(mac)) commandQueues.set(mac, []);
  commandQueues.get(mac).push(command);
}

// گرفتن و خالی کردن صف
function drainCommands(mac) {
  const q = commandQueues.get(mac) || [];
  commandQueues.set(mac, []);
  return q;
}

// POST /api/arduino/send-command
exports.sendCommand = (req, res, io) => {
  console.log('➡️ sendCommand called:', req.body);
  try {
    const { mac, command } = req.body;
    if (!mac || !command || !command.action) {
      return res.status(400).json({ success: false, message: 'mac و command.action الزامی است' });
    }
    enqueueCommand(mac, command);

    io.emit('command-queued', { mac, command });

    return res.json({ success: true });
  } catch (e) {
    console.error('sendCommand error:', e);
    return res.status(500).json({ success: false });
  }
};


// GET /api/arduino/commands?mac=XX
exports.getCommands = (req, res) => {
  try {
    const { mac } = req.query;
    if (!mac) return res.status(400).json({ success: false, message: 'mac لازم است' });
    const commands = drainCommands(mac);
    return res.json({ success: true, commands });
  } catch (e) {
    console.error('getCommands error:', e);
    return res.status(500).json({ success: false });
  }
};

// POST /api/arduino/data  (از آردوینو)
exports.receiveSensorData = (req, res, io) => {
  try {
    const { mac, type, data } = req.body || {};
    if (!mac || !type) return res.status(400).json({ success: false, message: 'mac و type لازم است' });

    // انتشار برای داشبورد
    io.emit('sensor-data', { mac, type, data });

    return res.json({ success: true });
  } catch (e) {
    console.error('receiveSensorData error:', e);
    return res.status(500).json({ success: false });
  }
};

// GET /api/arduino/ping
exports.ping = (req, res) => {
  res.json({ ok: true, ts: Date.now() });
};
