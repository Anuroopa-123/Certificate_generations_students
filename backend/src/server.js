const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const certificateRoutes = require('./routes/certificates');
const publicRoutes = require('./routes/public');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(morgan('dev'));
app.use(cors({
  origin: '*', // Allow front-end Angular client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Disposition', 'X-Downloads-Used', 'X-Downloads-Remaining']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await db.query('SELECT NOW() as current_time');
    res.json({
      status: 'healthy',
      company: 'Raventiq Technologies',
      leadership: {
        cto: 'Anu (Co-Founder & CTO)',
        cbo: 'Dinesh (Co-Founder & CBO)'
      },
      database: 'connected',
      server_time: dbTest.rows[0].current_time
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/public', publicRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Raventiq Technologies Certificate System Backend`);
  console.log(` SuperAdmin: Anu (Co-Founder & CTO)`);
  console.log(` Admin:      Dinesh (Co-Founder & CBO)`);
  console.log(` Server running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
