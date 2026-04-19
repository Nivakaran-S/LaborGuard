const mongoose = require('mongoose');
const Grid = require('gridfs-stream');

let gfs, gridfsBucket;

const conn = mongoose.connection;

// We use an async flag to track if initialization is done
let isInitialized = false;

conn.once('open', () => {
    // We already handle this in a more robust way below manually or via requests
    initializeGridFS();
});

const initializeGridFS = () => {
    if (isInitialized) return;

    if (conn.db) {
        console.log('GridFS Bucket initializing...');
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'fs'
        });
        gfs = Grid(conn.db, mongoose.mongo);
        gfs.collection('fs');
        isInitialized = true;
    }
};

const getGridFSBucket = () => {
    if (!gridfsBucket) initializeGridFS();
    return gridfsBucket;
};

const getGFS = () => {
    if (!gfs) initializeGridFS();
    return gfs;
};

module.exports = { getGridFSBucket, getGFS };
