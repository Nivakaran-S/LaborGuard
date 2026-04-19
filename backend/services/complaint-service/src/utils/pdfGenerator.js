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

module.exports = {
    generateComplaintPDF
};
