const express = require('express');
const router  = express.Router();
const commentController = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { moderateContent } = require('../middleware/contentModeration');

router.use(protect);

// Apply Perspective-API toxicity moderation to comment writes (create + edit)
// the same way postRoutes.js does for posts. Reads/deletes/reports skip it
// because they don't accept user content in the body.
router.post('/:postId',           moderateContent, commentController.addComment);
router.get('/:postId',            commentController.getComments);
router.patch('/:commentId',       moderateContent, commentController.updateComment);
router.delete('/:commentId',      commentController.deleteComment);
router.post('/:commentId/report', commentController.reportComment);

module.exports = router;
