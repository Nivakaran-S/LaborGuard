// FIXED
const express = require('express');
const router  = express.Router();
const statusController    = require('../controllers/statusController');
const { protect }         = require('../middleware/authMiddleware');
const { upload }          = require('../utils/cloudinaryConfig');
const { moderateImages }  = require('../middleware/imageModeration');
const { moderateContent } = require('../middleware/contentModeration');

router.use(protect);

router.post('/',            // ✅ multer + moderation now wired in
  upload.single('media'),
  moderateImages,
  moderateContent,
  statusController.createStatus
);
router.get('/:userId',      statusController.getStatuses);
router.delete('/:statusId', statusController.deleteStatus);

module.exports = router;