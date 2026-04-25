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

/**
 * Generate a PDF job report for employers: job details + applicants summary.
 */
const generateJobReport = async (job, applications = []) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageSize = [595.28, 841.89]; // A4
    let page = pdfDoc.addPage(pageSize);
    const { width, height } = page.getSize();
    const margin = 50;
    let y = height - margin;

    const ensureSpace = (needed) => {
        if (y - needed < margin) {
            page = pdfDoc.addPage(pageSize);
            y = height - margin;
        }
    };

    const drawLine = () => {
        page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
        });
        y -= 10;
    };

    const drawText = (text, { size = 11, isBold = false, color = rgb(0, 0, 0) } = {}) => {
        const f = isBold ? bold : font;
        const maxW = width - margin * 2;
        const words = String(text || '').split(/\s+/);
        let line = '';
        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            if (f.widthOfTextAtSize(testLine, size) > maxW && line) {
                ensureSpace(size + 4);
                page.drawText(line, { x: margin, y, size, font: f, color });
                y -= size + 4;
                line = word;
            } else {
                line = testLine;
            }
        }
        if (line) {
            ensureSpace(size + 4);
            page.drawText(line, { x: margin, y, size, font: f, color });
            y -= size + 4;
        }
    };

    // Header
    drawText('LaborGuard — Job Report', { size: 20, isBold: true, color: rgb(0.05, 0.4, 0.4) });
    drawText(`Generated ${new Date().toLocaleString()}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
    y -= 8;
    drawLine();

    // Job summary
    drawText(job.title || 'Untitled Job', { size: 16, isBold: true });
    drawText(`Employer: ${job.employerName || job.companyName || 'N/A'}`, { size: 11 });
    drawText(`Location: ${job.location || 'N/A'}`, { size: 11 });
    drawText(`Type: ${job.jobType || job.type || 'N/A'}`, { size: 11 });
    if (job.salary || job.salaryRange) {
        drawText(`Salary: ${job.salary || job.salaryRange}`, { size: 11 });
    }
    drawText(`Status: ${job.status || (job.isActive === false ? 'closed' : 'active')}`, { size: 11 });
    drawText(`Posted: ${job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}`, { size: 11 });
    y -= 6;

    if (job.description) {
        drawText('Description', { size: 12, isBold: true });
        drawText(job.description, { size: 10 });
        y -= 6;
    }

    drawLine();

    // Applicants summary
    drawText(`Applicants (${applications.length})`, { size: 14, isBold: true });

    const statusCounts = applications.reduce((acc, a) => {
        const s = a.status || 'pending';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    Object.entries(statusCounts).forEach(([s, n]) => {
        drawText(`  • ${s}: ${n}`, { size: 10 });
    });
    y -= 6;

    if (applications.length === 0) {
        drawText('No applications received yet.', { size: 10, color: rgb(0.5, 0.5, 0.5) });
    } else {
        drawLine();
        applications.forEach((a, i) => {
            ensureSpace(50);
            drawText(`${i + 1}. ${a.applicantName || a.name || 'Anonymous'}`, { size: 11, isBold: true });
            if (a.email) drawText(`   ${a.email}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
            drawText(`   Status: ${a.status || 'pending'}   Applied: ${a.appliedAt ? new Date(a.appliedAt).toLocaleDateString() : 'N/A'}`, { size: 9, color: rgb(0.4, 0.4, 0.4) });
            if (a.coverLetter) drawText(`   Note: ${String(a.coverLetter).slice(0, 240)}`, { size: 9 });
            y -= 4;
        });
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
};

module.exports = { generatePdfContract, generateJobReport };
