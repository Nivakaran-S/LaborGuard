/**
 * imageModeration.js — NSFW image classifier middleware.
 *
 * NSFWJS + TensorFlow.js loads a ~200MB model into RAM. On Render's 512MB
 * free instance, this OOMs the process under load (multipart upload + model
 * + everything else exceeds the cap). When the worker dies mid-request,
 * Render returns a 502 placeholder without CORS headers — the browser
 * reports a misleading "No Access-Control-Allow-Origin" error.
 *
 * Fix: gate the check behind DISABLE_NSFW_CHECK so paid-tier / self-hosted
 * deployments can still moderate, but free-tier defaults to skip.
 *
 * Env values that disable the check:
 *   DISABLE_NSFW_CHECK=true|1|yes
 * Anything else (or unset) keeps NSFW checking on.
 */

const SKIP = /^(true|1|yes)$/i.test(process.env.DISABLE_NSFW_CHECK || '');

// Lazy require so we don't even load tfjs if disabled.
let classifyImage = null;
const getClassifier = () => {
    if (!classifyImage) {
        classifyImage = require('../utils/nsfwCheck').classifyImage;
    }
    return classifyImage;
};

const moderateImages = async (req, res, next) => {
    if (SKIP) return next();

    try {
        const files = req.files || (req.file ? [req.file] : []);
        if (files.length === 0) return next();

        const imageFiles = files.filter((f) => f.mimetype.startsWith('image/'));
        const classify = getClassifier();

        for (const file of imageFiles) {
            const result = await classify(file.buffer, file.mimetype);

            if (result.isNSFW) {
                return res.status(403).json({
                    message: 'Image flagged as inappropriate content',
                    nsfwScore: result.nsfwScore,
                    categories: result.scores,
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
