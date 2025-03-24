const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { swaggerUi, specs } = require("./swagger"); // Import Swagger
require('dotenv').config();

// Import Routes (Users First)
const userRoutes = require('./routes/userRoutes');
const driverRoutes = require('./routes/driverRoutes');
const medicRoutes = require('./routes/medicRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const incidentRoutes = require('./routes/incidentRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev')); // Logs requests
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*', // 🔒 Replace '*' with frontend URL in production
    credentials: true,
  })
);

// Connect to Database
connectDB();

// Swagger Documentation Route
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

// API Routes (Users First)
app.use('/api/users', userRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/medics', medicRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/incidents', incidentRoutes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
  next();
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
