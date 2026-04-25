const express = require('express');
const router  = express.Router();
const commentController = require('../controllers/commentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/:postId',           commentController.addComment);
router.get('/:postId',            commentController.getComments);
router.patch('/:commentId',       commentController.updateComment);
router.delete('/:commentId',      commentController.deleteComment);
router.post('/:commentId/report', commentController.reportComment);

module.exports = router;