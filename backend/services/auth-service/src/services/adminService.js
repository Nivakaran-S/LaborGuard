const User = require('../models/User');
const emailService = require('./emailService');

const getAllUsers = async (query) => {
    // Pagination setup
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Optional filtering
    let filter = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';

    const users = await User.find(filter)
        .select('-password') // Never return passwords
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

const updateUserRole = async (userId, newRole) => {
    const validRoles = ['worker', 'lawyer', 'ngo', 'employer', 'admin'];
    if (!validRoles.includes(newRole)) {
        throw { statusCode: 400, message: 'Invalid role provided' };
    }

    const user = await User.findById(userId);
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }

    user.role = newRole;
    await user.save();

    return { message: `User role updated to ${newRole}` };
};

const updateAccountStatus = async (userId, isActive) => {
    const user = await User.findById(userId);
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }

    user.isActive = isActive;
    await user.save();

    return { message: `User account has been ${isActive ? 'activated' : 'deactivated'}` };
};

const deleteUser = async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }

    // Note: We might also want to delete their RefreshTokens and VerificationCodes to clean up completely

    return { message: 'User deleted permanently' };
};

const approveUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }

    if (user.isApproved) {
        return { message: 'User is already approved' };
    }

    user.isApproved = true;
    await user.save();

    // Fire off the approval email
    try {
        await emailService.sendApprovalEmail(user.email, user.firstName);
    } catch (err) {
        console.error('Failed to send approval email:', err);
    }

    return { message: `${user.role} user has been approved successfully` };
};

const rejectUser = async (userId, reason) => {
    const user = await User.findById(userId);
    if (!user) {
        throw { statusCode: 404, message: 'User not found' };
    }

    if (user.isApproved) {
        throw { statusCode: 400, message: 'Cannot reject an already approved user. Deactivate them instead.' };
    }

    // Capture detail before deleting
    const email = user.email;
    const name = user.firstName;

    // Send the rejection email and reason FIRST
    try {
        await emailService.sendRejectionEmail(email, name, reason);
    } catch (err) {
        console.error('Failed to send rejection email:', err);
    }

    // Now delete the user records from the primary collection
    await User.findByIdAndDelete(userId);
    
    // (Optional) We could also clean up VerificationCode and RefreshToken here
    // but MongoDB handles orphaned records decently well via TTLs or they just sit idle.

    return { message: `Pending ${user.role} account has been rejected and removed.` };
};

module.exports = {
    getAllUsers,
    updateUserRole,
    updateAccountStatus,
    deleteUser,
    approveUser,
    rejectUser
};
