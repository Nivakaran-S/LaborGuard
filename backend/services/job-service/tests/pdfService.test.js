/**
 * Unit test for the PDF report generator (E32).
 * Pure function — no DB, no network. Verifies it emits a non-empty PDF buffer
 * with the standard %PDF magic header for a representative job + applicants.
 */

const { generateJobReport } = require('../src/services/pdfService');

describe('pdfService.generateJobReport', () => {
  const job = {
    title: 'Senior Welder',
    employerName: 'Acme Engineering',
    location: 'Colombo',
    jobType: 'full_time',
    salaryRange: 'LKR 100,000–140,000',
    status: 'active',
    description: 'Welding fabrication on industrial sites; 3+ yrs exp.',
    createdAt: new Date('2025-01-15'),
  };

  const applications = [
    { applicantName: 'A. Worker', email: 'a@example.com', status: 'pending', appliedAt: new Date(), coverLetter: 'Hi' },
    { applicantName: 'B. Worker', email: 'b@example.com', status: 'accepted', appliedAt: new Date() },
    { applicantName: 'C. Worker', status: 'rejected' },
  ];

  it('produces a non-empty PDF buffer', async () => {
    const buf = await generateJobReport(job, applications);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(500);
  });

  it('writes a valid PDF header (%PDF-)', async () => {
    const buf = await generateJobReport(job, applications);
    expect(buf.slice(0, 5).toString()).toBe('%PDF-');
  });

  it('handles a job with zero applications', async () => {
    const buf = await generateJobReport(job, []);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(500);
  });

  it('handles a minimal job missing optional fields', async () => {
    const buf = await generateJobReport({ title: 'Helper' }, []);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });
});
