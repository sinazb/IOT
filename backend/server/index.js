require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const mongoUri = "mongodb://localhost:27017/smart-home"
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const deviceTypeRoutes = require('./routes/deviceTypeRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/device-types', deviceTypeRoutes);

const arduinoRoutes = require('./routes/arduinoRoutes');
app.use('/api/arduino', arduinoRoutes);


// Optional: Redirect base URL to login.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
