const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinaryConfig');

// All routes require a valid JWT
router.use(protect);

// FIX: was GET /conversations/:userId (userId in URL — insecure, client can spoof any userId)
// Now: GET /conversations — userId read from req.user.userId inside controller
router.post('/conversations',                       messageController.createConversation);
router.get('/conversations',                        messageController.getConversations);

router.get('/messages/:conversationId',             messageController.getMessages);
router.post('/messages', upload.array('media', 5),  messageController.sendMessage);
router.patch('/messages/:conversationId/read',      messageController.markAsRead);
router.delete('/messages/:messageId',               messageController.deleteMessage);

module.exports = router;