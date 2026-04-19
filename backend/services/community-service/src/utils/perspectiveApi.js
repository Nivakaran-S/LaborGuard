const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const TOXICITY_THRESHOLD = parseFloat(process.env.TOXICITY_THRESHOLD) || 0.7;

const analyzeText = async (text) => {
    if (!OPENAI_API_KEY) {
        console.warn('[community-service] OPENAI_API_KEY not set, skipping toxicity check');
        return { isToxic: false, score: 0 };
    }

    if (!text || text.trim().length === 0) {
        return { isToxic: false, score: 0 };
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/moderations',
            { input: text },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = response.data.results[0];
        const maxScore = Math.max(...Object.values(result.category_scores));

        return {
            isToxic: result.flagged || maxScore >= TOXICITY_THRESHOLD,
            score: maxScore,
            categories: result.categories
        };
    } catch (error) {
        console.error('[community-service] OpenAI Moderation API error:', error.message);
        return { isToxic: false, score: 0 };
    }
};

module.exports = { analyzeText };
