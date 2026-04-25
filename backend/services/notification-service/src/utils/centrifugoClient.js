const axios = require('axios');

// Same wire format as messaging-service's client. Fire-and-forget — if the
// Centrifugo API is unreachable we log and move on; the polling fallback in
// the frontend keeps the user from missing notifications even when realtime
// is degraded.

if (process.env.NODE_ENV === 'production') {
    if (!process.env.CENTRIFUGO_API_KEY || !process.env.CENTRIFUGO_API_URL) {
        console.warn('[notification-service] CENTRIFUGO_API_KEY/CENTRIFUGO_API_URL not set — realtime push disabled, falling back to client polling');
    }
}

const CENTRIFUGO_API_KEY = process.env.CENTRIFUGO_API_KEY || '';
const CENTRIFUGO_API_URL = process.env.CENTRIFUGO_API_URL || '';

const publishToChannel = async (channel, data) => {
    if (!CENTRIFUGO_API_KEY || !CENTRIFUGO_API_URL) return null; // disabled
    try {
        const response = await axios.post(
            CENTRIFUGO_API_URL,
            {
                method: 'publish',
                params: { channel, data },
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `apikey ${CENTRIFUGO_API_KEY}`,
                },
                timeout: 5000,
            }
        );
        return response.data;
    } catch (error) {
        console.error('[notification-service] Centrifugo publish error:', error.message);
        return null;
    }
};

module.exports = { publishToChannel };
