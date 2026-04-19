const https = require('https');

const generateEmploymentContract = async (workerName, employerName, jobTitle, jobDescription, wage, arrivalDate, location) => {
    const key = process.env.GROQ_API_KEY || "";
    if (!key) {
        console.warn("GROQ_API_KEY is missing. Skipping AI contract generation.");
        return null;
    }

    try {
        const prompt = `
        You are a highly professional legal AI. Generate a formal employment contract for the following position:
        - Job Title: ${jobTitle}
        - Employer: ${employerName}
        - Employee: ${workerName}
        - Description: ${jobDescription}
        - Wage: ${wage}
        - Start Date: ${arrivalDate}
        - Work Location: ${location}

        Return ONLY the internal body content of a formal employment contract. Use standard HTML tags (<h1>, <p>, <ul>, <li>, <br>). 
        IMPORTANT: Do NOT include <html>, <head>, or <body> tags, and do NOT include markdown codeblocks (\`\`\`). Just start directly with the <h1> title.
        Add inline CSS for a professional, clean, and elegant legal document look (e.g., serif fonts, borders, signature lines at the bottom).
        `;

        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
        };

        const result = await makeGroqRequest(key, JSON.stringify(payload));
        
        // Wrap in a professional HTML document shell
        const documentWrapper = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Times New Roman', Times, serif; color: #1a1a1a; line-height: 1.6; padding: 40px; }
                h1 { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 30px; }
                h2 { border-bottom: 1px solid #ccc; margin-top: 30px; }
                .contract-body { max-width: 800px; margin: 0 auto; }
            </style>
        </head>
        <body>
            <div class="contract-body">
                ${result.trim()}
            </div>
        </body>
        </html>
        `;

        return documentWrapper.trim();
    } catch (err) {
        console.error(`[AI Contract Generation Error]`, err.message);
        return null;
    }
};

function makeGroqRequest(key, body) {
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
                    let content = json.choices[0].message.content;
                    // Clean markdown if AI accidentally includes it
                    content = content.replace(/^```html\s*/i, '').replace(/```$/i, '');
                    resolve(content);
                } catch (e) { reject(new Error("Invalid JSON response from AI")); }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

module.exports = { generateEmploymentContract };
