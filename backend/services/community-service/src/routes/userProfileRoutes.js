const express = require('express');
const router  = express.Router();
const userProfileController = require('../controllers/userProfileController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Static paths MUST come before /:userId to avoid Express catching them as param values
router.post('/follow',                     userProfileController.followUser);
router.post('/unfollow',                   userProfileController.unfollowUser);
router.post('/bookmark',                   userProfileController.toggleBookmark);
router.get('/search',                      userProfileController.searchProfiles);

// Follow requests (private profiles)
router.get('/requests/incoming',           userProfileController.getIncomingFollowRequests);
router.post('/requests/:id/approve',       userProfileController.approveFollowRequest);
router.post('/requests/:id/reject',        userProfileController.rejectFollowRequest);

// Parameterised routes are safe after the static ones
router.get('/:userId',           userProfileController.getProfile);
router.get('/:userId/stats',     userProfileController.getProfileStats);
router.post('/',                 userProfileController.createOrUpdateProfile);
router.get('/:userId/bookmarks', userProfileController.getBookmarks);
router.post('/:userId/report',   userProfileController.reportProfile);

module.exports = router;