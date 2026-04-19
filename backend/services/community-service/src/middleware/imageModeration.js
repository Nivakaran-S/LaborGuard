const { classifyImage } = require('../utils/nsfwCheck');

const moderateImages = async (req, res, next) => {
    try {
        const files = req.files || (req.file ? [req.file] : []);

        if (files.length === 0) {
            return next();
        }

        const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));

        for (const file of imageFiles) {
            const result = await classifyImage(file.buffer, file.mimetype);

            if (result.isNSFW) {
                return res.status(403).json({
                    message: 'Image flagged as inappropriate content',
                    nsfwScore: result.nsfwScore,
                    categories: result.scores
                });
            }
        }

        next();
    } catch (error) {
        console.error('[community-service] Image moderation error:', error.message);
        next();
    }
};

module.exports = { moderateImages };
