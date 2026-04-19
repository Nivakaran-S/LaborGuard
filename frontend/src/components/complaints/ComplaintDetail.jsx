import { useState } from 'react';
import Alert from '../core/Alert';

const ComplaintDetail = ({ complaint, role, onStatusUpdate, onAssign, statusOptions = [] }) => {
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [officerId, setOfficerId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleStatusUpdate = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await onStatusUpdate({ status: newStatus, reason });
      setMessage('Complaint status updated.');
      setNewStatus('');
      setReason('');
    } catch (err) {
      setError(err.message || 'Unable to update status.');
    }
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await onAssign({ officerId });
      setMessage('Legal officer assigned successfully.');
      setOfficerId('');
    } catch (err) {
      setError(err.message || 'Unable to assign complaint.');
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary mb-2">{complaint.title}</h1>
            <p className="text-text-secondary">{complaint.category || 'No category selected'}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-[0.80rem] font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {complaint.status}
          </span>
        </div>

        {error && <Alert type="error" message={error} />}
        {message && <Alert type="success" message={message} />}

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-2">Complaint overview</h2>
            <p className="text-text-secondary whitespace-pre-line">{complaint.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-text-secondary">Employer</p>
              <p className="mt-2 font-semibold text-text-primary">{complaint.employerInfo?.name || 'Not provided'}</p>
              <p className="text-sm text-text-secondary mt-1">{complaint.employerInfo?.details || 'No additional employer details'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-text-secondary">Filed on</p>
              <p className="mt-2 font-semibold text-text-primary">{new Date(complaint.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-text-secondary mt-1">Complaint ID: {complaint._id}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-text-secondary">Assigned officer</p>
              <p className="mt-2 font-semibold text-text-primary">{complaint.assignedTo || 'Not assigned yet'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-text-secondary">Last updated</p>
              <p className="mt-2 font-semibold text-text-primary">{new Date(complaint.updatedAt || complaint.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        {(role === 'admin' || role === 'legal_officer') && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-text-primary mb-4">Update complaint</h2>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="form-label">New status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="modern-select">
                  <option value="">Choose status</option>
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Reason / note</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="modern-input resize-none" rows="4" placeholder="Explain the update or next step." />
              </div>
              <button type="submit" className="btn-primary w-full">Apply status</button>
            </form>
          </div>
        )}

        {role === 'admin' && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-extrabold text-text-primary mb-4">Assign legal officer</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <label className="block">
                <span className="form-label">Officer ID</span>
                <input type="text" value={officerId} onChange={(e) => setOfficerId(e.target.value)} className="modern-input" placeholder="Enter officer user ID" />
              </label>
              <button type="submit" className="btn-primary w-full">Assign officer</button>
            </form>
          </div>
        )}
      </aside>
    </div>
  );
};

export default ComplaintDetail;
