// NOTE: This file is not the auth-service entry point. The real entry point is
// `src/server.js` (see package.json `main` and `scripts.start`). This stub is
// kept only for legacy reasons and re-exports the production app.
//
// Kafka has been removed in favour of HTTP-based event delivery (see
// src/utils/kafkaProducer.js for the new implementation).

module.exports = require('./server');
