const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { upload } = require('../utils/cloudinaryConfig');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Listing and detail
router.get('/',                          campaignController.getCampaigns);
router.post('/',
    authorize('ngo', 'ngo_representative', 'admin'),
    upload.single('image'),
    campaignController.createCampaign
);

router.get('/:id',                       campaignController.getCampaignById);
router.put('/:id',                       campaignController.updateCampaign);
router.delete('/:id',                    campaignController.deleteCampaign);

router.get('/:id/supporters',            campaignController.getCampaignSupporters);
router.post('/:id/support',              campaignController.supportCampaign);
router.post('/:id/unsupport',            campaignController.unsupportCampaign);

router.get('/:id/updates',               campaignController.getCampaignUpdates);
router.post('/:id/updates',
    upload.array('media', 5),
    campaignController.addCampaignUpdate
);

module.exports = router;
