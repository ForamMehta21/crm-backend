const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const mongoose = require('mongoose');
dotenv.config();

connectDB();
// Increase timeout for mongoose operations
mongoose.set('bufferTimeoutMS', 30000);

const app = express();

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001' , 'https://crm-realestate-737a2.web.app'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Real Estate CRM API is running...' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/property-types', require('./routes/propertyTypeRoutes'));
app.use('/api/property-conditions', require('./routes/propertyConditionRoutes'));
app.use('/api/landmarks', require('./routes/landmarkRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/builders', require('./routes/builderRoutes'));
app.use('/api/investors', require('./routes/investorRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Export app for Firebase Functions
module.exports = app;

// Local server (only runs when not in Firebase)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}
