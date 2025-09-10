require('dotenv').config();
console.log("JWT_SECRET:", process.env.JWT_SECRET);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});


// Mongo
const mongoUri = "mongodb://localhost:27017/smart-home";
mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// HTTP server + Socket.IO
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// فقط برای داشبورد (مرورگر)
io.on('connection', (socket) => {
  console.log("🔌 Client connected:", socket.id);
  socket.on('disconnect', () => console.log("❌ Client disconnected:", socket.id));
});

// Routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const deviceTypeRoutes = require('./routes/deviceTypeRoutes');
const arduinoRoutes = require('./routes/arduinoRoutes')(io); // 👈 io پاس داده شد

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/device-types', deviceTypeRoutes);
app.use('/api/arduino', arduinoRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
