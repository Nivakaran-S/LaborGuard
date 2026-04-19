const { analyzeText } = require('../utils/perspectiveApi');

const moderateContent = async (req, res, next) => {
    const content = req.body.content;

    if (!content || content.trim().length === 0) {
        return next();
    }

    try {
        const result = await analyzeText(content);

        if (result.isToxic) {
            return res.status(403).json({
                message: 'Content flagged as toxic',
                toxicityScore: result.score
            });
        }

        req.toxicityScore = result.score;
        next();
    } catch (error) {
        console.error('[community-service] Content moderation error:', error.message);
        next();
    }
};

module.exports = { moderateContent };
