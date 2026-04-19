const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

/**
 * Generates a professional PDF from the contract text provided by AI.
 * Strips HTML tags and uses high-quality PDF drawing for a premium look.
 */
const generatePdfContract = async (htmlContent) => {
    try {
        // 1. Strip HTML tags for PDF drawing (we handle styling manually)
        // 1. Extract only the body content to avoid headers/styles appearing as text
        let bodyContent = htmlContent;
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            bodyContent = bodyMatch[1];
        }

        const cleanText = bodyContent
            .replace(/<[^>]*>?/gm, '') // Remove tags
            .replace(/\n\s*\n/g, '\n\n') // Normalize spacing
            .trim();

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
        
        // Settings
        const pageSize = [600, 800];
        let page = pdfDoc.addPage(pageSize);
        const { width, height } = page.getSize();
        const margin = 50;
        const fontSize = 12;
        const titleSize = 18;
        const lineHeight = 15;
        
        let cursorY = height - margin;

        // helper to handle word wrap
        const drawText = (text, options = {}) => {
            const currentFont = options.bold ? boldFont : font;
            const currentSize = options.size || fontSize;
            const words = text.split(' ');
            let line = '';

            for (const word of words) {
                const testLine = line + word + ' ';
                const textWidth = currentFont.widthOfTextAtSize(testLine, currentSize);
                
                if (textWidth > (width - (margin * 2))) {
                    page.drawText(line, { x: margin, y: cursorY, size: currentSize, font: currentFont });
                    line = word + ' ';
                    cursorY -= lineHeight;
                    
                    // New page check
                    if (cursorY < margin) {
                        page = pdfDoc.addPage(pageSize);
                        cursorY = height - margin;
                    }
                } else {
                    line = testLine;
                }
            }
            
            page.drawText(line, { x: margin, y: cursorY, size: currentSize, font: currentFont });
            cursorY -= lineHeight * 1.5; // Paragraph spacing
        };

        // Draw Content
        const lines = cleanText.split('\n');
        lines.forEach((line, index) => {
            if (index === 0) {
                // Assume first line is title
                drawText(line, { size: titleSize, bold: true });
                cursorY -= 10;
            } else if (line.trim() === '') {
                cursorY -= 5;
            } else {
                drawText(line);
            }
        });

        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    } catch (error) {
        console.error('[PDF Generation Error]', error);
        return null;
    }
};

module.exports = { generatePdfContract };
