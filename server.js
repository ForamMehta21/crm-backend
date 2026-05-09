const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initCronJobs } = require('./utils/cronJobs');
const mongoose = require('mongoose');
dotenv.config();

// Increase timeout for mongoose operations
mongoose.set('bufferTimeoutMS', 30000);

const app = express();

// Configure CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Real Estate CRM API is running...' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/property-types', require('./routes/propertyTypeRoutes'));
app.use('/api/property-conditions', require('./routes/propertyConditionRoutes'));
app.use('/api/landmarks', require('./routes/landmarkRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/builders', require('./routes/builderRoutes'));
app.use('/api/investors', require('./routes/investorRoutes'));
app.use('/api/whatsapp', require('./routes/whatsappRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Export app for testing
module.exports = app;

// Start server
const startServer = async () => {
  await connectDB();
  initCronJobs();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
