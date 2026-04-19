const dotenv = require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { connectProducer } = require('./utils/kafkaProducer');

// Connect to MongoDB
connectDB();

// Connect Kafka producer so auth-service can emit events like 'user_registered'.
// This is non-blocking — if Kafka is unavailable the server still starts.
connectProducer().catch(err =>
    console.error('[auth-service] Kafka producer startup error:', err.message)
);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
});