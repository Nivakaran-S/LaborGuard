import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComplaint } from '../../services/complaint/complaintService';
import Alert from '../core/Alert';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  'Wage Violation',
  'Workplace Safety',
  'Harassment',
  'Contract Breach',
  'Wrongful Termination',
  'Discrimination',
  'Other',
];

const ComplaintForm = ({ onSuccess }) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [employerName, setEmployerName] = useState('');
  const [employerDetails, setEmployerDetails] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('Please provide a complaint title.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Please describe the issue in at least 20 characters.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await createComplaint({
        title: title.trim(),
        description: description.trim(),
        category,
        employerInfo: {
          name: employerName.trim(),
          details: employerDetails.trim(),
        },
      });

      setSuccess('Your complaint has been filed successfully. Redirecting...');
      setTitle('');
      setDescription('');
      setEmployerName('');
      setEmployerDetails('');
      setCategory(CATEGORIES[0]);

      if (onSuccess) onSuccess();

      // FIX: Navigate to complaints list after success so user can see their filed complaint
      setTimeout(() => navigate('/worker/complaints'), 1500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to file your complaint. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error   && <Alert type="error"   message={error} />}
      {success && <Alert type="success" message={success} />}

      <div className="form-group">
        <label htmlFor="cf-title" className="form-label">
          Complaint Title <span className="text-red-500">*</span>
        </label>
        <input
          id="cf-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          className="modern-input"
          placeholder="Brief summary of the issue (e.g. Unpaid wages for March)"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cf-category" className="form-label">Category</label>
        <select
          id="cf-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="modern-select"
          disabled={isSubmitting}>
          {CATEGORIES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="cf-description" className="form-label">
          Full Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cf-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          required
          className="modern-input resize-none"
          placeholder="Describe exactly what happened, when it occurred, who was involved, and any evidence you have."
          disabled={isSubmitting}
        />
        <p className="text-[10px] text-slate-400 mt-1 font-medium">
          {description.length} / 2000 characters
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="form-group">
          <label htmlFor="cf-employer-name" className="form-label">Employer / Company Name</label>
          <input
            id="cf-employer-name"
            type="text"
            value={employerName}
            onChange={(e) => setEmployerName(e.target.value)}
            className="modern-input"
            placeholder="e.g. Acme Construction Ltd."
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="cf-employer-details" className="form-label">Employer Contact / Location</label>
          <input
            id="cf-employer-details"
            type="text"
            value={employerDetails}
            onChange={(e) => setEmployerDetails(e.target.value)}
            className="modern-input"
            placeholder="City, branch, or supervisor name"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* FIX: Button is now a proper submit button with loading state and disabled when submitting */}
      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Filing Complaint...
          </>
        ) : (
          'Submit Complaint'
        )}
      </button>
    </form>
  );
};

export default ComplaintForm;