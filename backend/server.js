require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/projects',  require('./routes/projects'));
app.use('/api/sbom',      require('./routes/sbom'));
app.use('/api/risk',      require('./routes/risk'));
app.use('/api/benchmark', require('./routes/benchmark'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status:    'OK',
    service:   'SupplyGuard API v2.0',
    mongo:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// 404
app.use((req, res) => res.status(404).json({ error: `Route ${req.path} not found` }));

const PORT      = process.env.PORT      || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supplyguard';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`✅ SupplyGuard API v2.0 running at http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
