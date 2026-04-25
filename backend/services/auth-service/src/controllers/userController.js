const User = require('../models/User');

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, profile } = req.body;

        // Prevent updating restricted fields
        delete req.body.email;
        delete req.body.phone;
        delete req.body.password;
        delete req.body.role;
        delete req.body.isEmailVerified;
        delete req.body.isPhoneVerified;

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            {
                $set: {
                    name,
                    'profile.occupation': profile?.occupation,
                    'profile.location': profile?.location,
                    'profile.preferredLanguage': profile?.preferredLanguage
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/users/search?q={query}
 * Searches users by name or email (case-insensitive).
 * Returns safe fields only — no password, no tokens.
 *
 * The User model stores names as firstName + lastName. Older versions of this
 * handler queried/selected a `name` field that does not exist, so every
 * search returned blank rows in the messaging "new chat" modal. Search now
 * runs against firstName/lastName/email and returns a composed display name.
 */
const searchUsers = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Query must be at least 2 characters' });
        }

        // Strip regex special characters to avoid users typing `(` or `*` and
        // hitting an "Invalid regular expression" 500.
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');

        const users = await User.find({
            $or: [
                { firstName: regex },
                { lastName: regex },
                { email: regex }
            ],
            _id: { $ne: req.user.userId },     // exclude self
            isActive: { $ne: false },          // hide deactivated accounts
        })
        .select('_id firstName lastName email role')
        .limit(10)
        .lean();

        const results = users.map(u => ({
            userId   : u._id.toString(),
            name     : `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            email    : u.email,
            role     : u.role,
            avatarUrl: '',
        }));

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProfile,
    updateProfile,
    searchUsers
};
