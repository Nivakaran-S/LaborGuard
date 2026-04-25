/**
 * testDb.js — shared MongoDB lifecycle for integration tests.
 *
 * Spins up an in-process MongoDB via mongodb-memory-server, swaps mongoose's
 * connection to it, and tears down cleanly after each suite. No real Atlas
 * connection during tests.
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongo = null;

const start = async () => {
    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
};

const stop = async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
    mongo = null;
};

const clear = async () => {
    if (mongoose.connection.readyState !== 1) return;
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) {
        await c.deleteMany({});
    }
};

module.exports = { setupTestDB: { start, stop, clear } };
