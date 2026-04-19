const axios = require('axios');

// In production require explicit config — never fall back silently.
if (process.env.NODE_ENV === 'production') {
    if (!process.env.CENTRIFUGO_API_KEY || !process.env.CENTRIFUGO_API_URL) {
        console.error('[messaging-service] CENTRIFUGO_API_KEY and CENTRIFUGO_API_URL are required in production');
        process.exit(1);
    }
}

const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || 'dev-only-centrifugo-key';
const CENTRIFUGO_API_URL = process.env.CENTRIFUGO_API_URL || 'http://localhost:8000/api';

const publishToChannel = async (channel, data) => {
    try {
        const response = await axios.post(
            CENTRIFUGO_API_URL,
            {
                method: 'publish',
                params: {
                    channel,
                    data
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `apikey ${CENTRIFUGO_API_KEY}`
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Centrifugo publish error:', error.message);
        throw error;
    }
};

module.exports = {
    publishToChannel
};
