const https = require('https');

/**
 * AI Service: [VERSION 3.0] Ultra-Robust Vision Connector
 * Eliminates decommissioned models and forces auto-discovery.
 */
const analyzeDocuments = async (documents, userRole) => {
  const key = process.env.GROQ_API_KEY || "";
  const keySafe = key ? `${key.substring(0, 6)}...${key.substring(key.length - 4)}` : "MISSING";
  
  console.log(`[AI GROQ V3] Starting analysis with key: ${keySafe}`);

  try {
    // 1. Ask Groq for the LIVE list of models
    const availableModels = await listGroqModels(key);
    
    // 2. Look for the best Vision/Multimodal model (2026 names: Compound, Scout)
    const visionModel = availableModels.find(m => m.includes('scout')) ||
                        availableModels.find(m => m.includes('compound')) ||
                        availableModels.find(m => m.includes('90b-vision')) ||
                        availableModels.find(m => m.includes('11b-vision')) ||
                        availableModels.find(m => m.includes('vision')); 

    if (!visionModel) {
      throw new Error(`CRITICAL: No Vision/Compound models found! Available: ${availableModels.join(', ')}`);
    }

    console.log(`[AI GROQ V3] Successfully selected: ${visionModel}`);

    const prompt = `
      You are an AI Document Verification Assistant for LaborGuard.
      Analyze these documents for a user with the role: "${userRole}".
      
      REQUIRED JSON OUTPUT:
      {
        "summary": "string",
        "appropriateness": "string",
        "isValid": boolean,
        "validationScore": number,
        "assessment": "Valid" | "Invalid" | "Suspicious",
        "reasoning": "string",
        "details": {
          "documentType": "string",
          "foundInformation": ["string"],
          "concerns": ["string"]
        }
      }
      ONLY JSON. DO NOT INCLUDE ANY OTHER TEXT.
    `;

    const messageContent = [
      { type: "text", text: prompt }
    ];

    for (const doc of documents) {
      if (doc.mimeType === 'application/pdf') {
        throw new Error("Groq does not support PDF directly. Please upload a Photo (JPG/PNG) of the document.");
      }
      
      messageContent.push({
        type: "image_url",
        image_url: { 
          // We use the full data URI as is standard for OpenAI-compatible APIs
          url: `data:${doc.mimeType};base64,${doc.buffer.toString('base64')}` 
        }
      });
    }

    const payload = {
      model: visionModel,
      messages: [{ role: "user", content: messageContent }],
      temperature: 0.1
    };

    // Note: Some experimental 2026 models might not support json_object yet
    // so we will only add it if the userRole implies we need a strict parse.
    if (userRole) {
      payload.response_format = { type: "json_object" };
    }

    const result = await makeGroqRequest(visionModel, key, JSON.stringify(payload));

    return result;

  } catch (err) {
    console.error(`[AI GROQ V3 ERROR]`, err.message);
    throw new Error(`Groq Error: ${err.message}`);
  }
};

function listGroqModels(key) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/models',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key}` }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (d) => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode !== 200) return reject(new Error(json.error?.message || "HTTP " + res.statusCode));
          resolve(json.data.map(m => m.id));
        } catch (e) { reject(new Error("Failed to parse model list")); }
      });
    }).on('error', reject);
  });
}

function makeGroqRequest(model, key, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => data += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode !== 200) return reject(new Error(json.error?.message || "HTTP " + res.statusCode));
          resolve(JSON.parse(json.choices[0].message.content));
        } catch (e) { reject(new Error("Invalid JSON response from AI")); }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(body);
    req.end();
  });
}

module.exports = { analyzeDocuments };
