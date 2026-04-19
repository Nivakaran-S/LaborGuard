const nsfwjs = require('nsfwjs');
const tf = require('@tensorflow/tfjs');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

let model = null;

const NSFW_THRESHOLD = parseFloat(process.env.NSFW_THRESHOLD) || 0.5;

const loadModel = async () => {
    if (!model) {
        model = await nsfwjs.load();
        console.log('[community-service] NSFWJS model loaded');
    }
    return model;
};

const imageBufferToTensor = (buffer, mimetype) => {
    let pixels, width, height;

    if (mimetype === 'image/png') {
        const png = PNG.sync.read(buffer);
        pixels = png.data;
        width = png.width;
        height = png.height;
        const rgb = new Uint8Array(width * height * 3);
        for (let i = 0; i < width * height; i++) {
            rgb[i * 3] = pixels[i * 4];
            rgb[i * 3 + 1] = pixels[i * 4 + 1];
            rgb[i * 3 + 2] = pixels[i * 4 + 2];
        }
        return tf.tensor3d(rgb, [height, width, 3]);
    } else {
        const rawImageData = jpeg.decode(buffer, { useTArray: true });
        pixels = rawImageData.data;
        width = rawImageData.width;
        height = rawImageData.height;
        const rgb = new Uint8Array(width * height * 3);
        for (let i = 0; i < width * height; i++) {
            rgb[i * 3] = pixels[i * 4];
            rgb[i * 3 + 1] = pixels[i * 4 + 1];
            rgb[i * 3 + 2] = pixels[i * 4 + 2];
        }
        return tf.tensor3d(rgb, [height, width, 3]);
    }
};

const classifyImage = async (imageBuffer, mimetype) => {
    try {
        const nsfwModel = await loadModel();
        const image = imageBufferToTensor(imageBuffer, mimetype);
        const predictions = await nsfwModel.classify(image);
        image.dispose();

        const scores = {};
        predictions.forEach(p => {
            scores[p.className] = p.probability;
        });

        const nsfwScore = (scores.Porn || 0) + (scores.Hentai || 0) + (scores.Sexy || 0);

        return {
            isNSFW: nsfwScore >= NSFW_THRESHOLD,
            nsfwScore,
            scores
        };
    } catch (error) {
        console.error('[community-service] NSFWJS classification error:', error.message);
        return { isNSFW: false, nsfwScore: 0, scores: {} };
    }
};

module.exports = { classifyImage, loadModel };
