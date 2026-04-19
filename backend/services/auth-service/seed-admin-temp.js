const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables (from the root .env)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_ATLAS_BASE;

if (!MONGODB_URI) {
    console.error('Error: MONGODB_ATLAS_BASE not found in .env');
    process.exit(1);
}

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'lawyer', 'employer', 'ngo', 'admin'], default: 'worker' },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected Successfully!');

        const adminEmail = 'admin@laborguard.com';
        const rawPassword = 'Admin@12345';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists. Updating password/role...');
            const salt = await bcrypt.genSalt(12);
            existingAdmin.password = await bcrypt.hash(rawPassword, salt);
            existingAdmin.role = 'admin';
            existingAdmin.isApproved = true;
            existingAdmin.isEmailVerified = true;
            existingAdmin.isPhoneVerified = true;
            await existingAdmin.save();
            console.log('Admin account UPDATED successfully.');
        } else {
            console.log('Creating new Admin account...');
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash(rawPassword, salt);

            const adminUser = new User({
                firstName: 'LaborGuard',
                lastName: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isApproved: true,
                isEmailVerified: true,
                isPhoneVerified: true
            });

            await adminUser.save();
            console.log('Admin account CREATED successfully.');
        }

        console.log('-----------------------------------');
        console.log('Admin Access Granted:');
        console.log('Email: ', adminEmail);
        console.log('Password: ', rawPassword);
        console.log('-----------------------------------');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
}

seedAdmin();
