const Notification = require('../models/Notification');
const { emitEvent } = require('../utils/kafkaProducer');
const { sendEmailNotification } = require('../utils/resendClient');

const createNotification = async (req, res) => {
    try {
        const { userId, type, title, body, relatedId } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({ error: 'userId, title, and body are required' });
        }

        const notification = new Notification({
            userId,
            type: type || 'system',
            title,
            body,
            relatedId
        });

        await notification.save();

        // Optional: Send external email via Resend if email is provided in body
        if (req.body.email) {
            await sendEmailNotification(
                req.body.email,
                `LaborGuard: ${title}`,
                `<p><strong>${title}</strong></p><p>${body}</p>`
            );
        }

        res.status(201).json(notification);
    } catch (error) {
        console.error('Error in createNotification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId; // FIX: from JWT — was req.params.userId (spoofable)
        const limit = parseInt(req.query.limit) || 20;
        const page = parseInt(req.query.page) || 1;

        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error in getNotifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId; // FIX: from JWT — was req.params.userId (spoofable)

        const count = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({ unreadCount: count });
    } catch (error) {
        console.error('Error in getUnreadCount:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json(notification);
    } catch (error) {
        console.error('Error in markAsRead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId; // FIX: from JWT — was req.params.userId (spoofable)

        const result = await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error('Error in markAllAsRead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findByIdAndDelete(id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error in deleteNotification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};