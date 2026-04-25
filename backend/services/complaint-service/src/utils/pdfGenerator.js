const PDFDocument = require('pdfkit');


//Generates a PDF report for a given complaint
// @param {Object} complaint - The complaint model instance
// @param {Object} res - Express response object
const generateComplaintPDF = (complaint, res) => {
    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF directly to the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=complaint_${complaint._id}.pdf`);
    doc.pipe(res);

    // Header
    doc
        .fillColor('#1a73e8')
        .fontSize(20)
        .text('LaborGuard — Complaint Report', { align: 'center' });

    doc.moveDown();
    doc
        .fillColor('#000000')
        .fontSize(10)
        .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#e0e0e0');
    doc.moveDown();

    // Basic Info Section
    doc.fontSize(14).fillColor('#1a73e8').text('Basic Information');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#000000');

    doc.text(`Complaint ID: ${complaint._id}`);
    doc.text(`Title: ${complaint.title}`);
    doc.text(`Category: ${complaint.category.replace(/_/g, ' ')}`);
    doc.text(`Priority: ${complaint.priority.toUpperCase()}`);
    doc.text(`Status: ${complaint.status.toUpperCase()}`);
    doc.text(`Filed On: ${new Date(complaint.createdAt).toLocaleString()}`);

    doc.moveDown();

    // Description Section
    doc.fontSize(14).fillColor('#1a73e8').text('Description');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#000000').text(complaint.description, {
        align: 'justify',
        lineGap: 2
    });

    doc.moveDown();

    // Organization & Location
    doc.fontSize(14).fillColor('#1a73e8').text('Incident Details');
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#000000');
    doc.text(`Organization: ${complaint.organizationName || 'N/A'}`);
    doc.text(`Location: ${complaint.location?.city || ''}, ${complaint.location?.district || ''}`);

    doc.moveDown();

    // Activity Log / History
    if (complaint.statusHistory && complaint.statusHistory.length > 0) {
        doc.fontSize(14).fillColor('#1a73e8').text('Status History');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#444444');

        complaint.statusHistory.forEach((history, index) => {
            doc.text(`${index + 1}. ${history.status.toUpperCase()} by ${history.changedByRole} (${new Date(history.changedAt).toLocaleDateString()})`);
            if (history.reason) doc.text(`   Reason: ${history.reason}`, { indent: 15 });
        });
    }

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc
            .fontSize(8)
            .fillColor('#888888')
            .text(
                'LaborGuard Protection System — This is an official system generated document.',
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
    }

    doc.end();
};

/**
 * Generates an aggregated NGO impact report PDF.
 * @param {Object} payload — { summary, byCategory, byStatus, bySector, complaints, filters }
 * @param {Object} res     — Express response
 */
const generateNgoReport = (payload, res) => {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ngo_report_${Date.now()}.pdf`);
    doc.pipe(res);

    const { summary = {}, byCategory = [], byStatus = [], complaints = [], filters = {} } = payload;

    // Header
    doc.fillColor('#1a73e8').fontSize(22).text('LaborGuard — NGO Impact Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fillColor('#555').fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    if (filters.organizationName) doc.text(`Organization: ${filters.organizationName}`, { align: 'right' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e0e0e0');
    doc.moveDown();

    // Summary cards
    doc.fillColor('#000').fontSize(14).text('Summary', { underline: false });
    doc.moveDown(0.5);
    const cards = [
        { label: 'Total Cases', value: summary.total ?? 0 },
        { label: 'Resolved', value: summary.resolved ?? 0 },
        { label: 'In Review', value: summary.underReview ?? 0 },
        { label: 'Pending', value: summary.pending ?? 0 },
        { label: 'Resolution Rate', value: summary.resolutionRate != null ? `${summary.resolutionRate}%` : '—' },
    ];
    cards.forEach((c) => {
        doc.fontSize(11).fillColor('#333').text(`• ${c.label}: `, { continued: true })
            .fillColor('#000').text(String(c.value));
    });
    doc.moveDown();

    // By category
    if (byCategory.length) {
        doc.fillColor('#000').fontSize(14).text('By Category');
        doc.moveDown(0.5);
        byCategory.forEach((c) => {
            doc.fontSize(10).fillColor('#333')
                .text(`  • ${c._id || c.category || 'Other'}: ${c.count}`);
        });
        doc.moveDown();
    }

    // By status
    if (byStatus.length) {
        doc.fillColor('#000').fontSize(14).text('By Status');
        doc.moveDown(0.5);
        byStatus.forEach((s) => {
            doc.fontSize(10).fillColor('#333')
                .text(`  • ${s._id || s.status || 'Unknown'}: ${s.count}`);
        });
        doc.moveDown();
    }

    // Case-level table (cap to avoid monster PDFs)
    if (complaints.length) {
        doc.addPage();
        doc.fillColor('#1a73e8').fontSize(16).text('Recent Cases', { underline: false });
        doc.moveDown();
        const rows = complaints.slice(0, 50);
        rows.forEach((c, i) => {
            if (doc.y > 720) doc.addPage();
            doc.fontSize(10).fillColor('#000').text(`${i + 1}. ${c.title || 'Untitled'}`);
            doc.fontSize(9).fillColor('#555').text(
                `   ${c.category || '—'} · ${c.status || '—'} · ${c.priority || '—'} · ${c.location?.district || c.location?.city || '—'} · ${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}`
            );
            doc.moveDown(0.3);
        });
    }

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(pages.start + i);
        doc.fontSize(8).fillColor('#888').text(
            'LaborGuard NGO Report — Generated from aggregated case data',
            50, doc.page.height - 50,
            { align: 'center' }
        );
    }

    doc.end();
};

module.exports = {
    generateComplaintPDF,
    generateNgoReport
};
