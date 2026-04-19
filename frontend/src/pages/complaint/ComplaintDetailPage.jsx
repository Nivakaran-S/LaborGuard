import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComplaintById, updateComplaintStatus } from '../../services/complaint/complaintService';
import { complaintApi } from '@/api/complaintApi';
import { registryApi } from '@/api/registryApi';
import Alert from '../../components/core/Alert';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from 'sonner';
import {
  ArrowLeft, Clock, Building2, User, Tag,
  CheckCircle2, XCircle, Loader2, MessageSquare, UserPlus, Trash2
} from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'under_review', 'resolved', 'rejected'];

const STATUS_CONFIG = {
  pending:      { label: 'Pending',    cls: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'In Review',  cls: 'bg-blue-100 text-blue-700' },
  resolved:     { label: 'Resolved',   cls: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',   cls: 'bg-red-100 text-red-700' },
};

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Officer assignment (admin only)
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchComplaint = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getComplaintById(id);
      const data = response.data.data;
      setComplaint(data);
      setNewStatus(data.status);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaint(); }, [id]);

  // Load officers for admins only
  useEffect(() => {
    if (user?.role !== 'admin') return;
    (async () => {
      try {
        const res = await registryApi.getAllOfficers({ limit: 100 });
        const list = res.data?.data?.officers || res.data?.officers || res.data?.data || [];
        setOfficers(list.filter((o) => o.isActive !== false));
      } catch (err) {
        // non-fatal; dropdown stays empty
        console.warn('Failed to load officers', err);
      }
    })();
  }, [user?.role]);

  const handleAssignOfficer = async () => {
    if (!selectedOfficerId) return;
    setAssigning(true);
    try {
      await complaintApi.assignComplaint(id, selectedOfficerId);
      toast.success('Officer assigned');
      await fetchComplaint();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign officer');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await complaintApi.deleteComplaint(id);
      toast.success('Complaint deleted');
      navigate('/complaints/admin');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete complaint');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (newStatus === complaint.status) return;
    setUpdating(true);
    setError('');
    setSuccess('');
    try {
      await updateComplaintStatus(id, { status: newStatus });
      setComplaint((prev) => ({ ...prev, status: newStatus }));
      setSuccess(`Status updated to "${newStatus.replace('_', ' ')}" successfully.`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update complaint status.');
    } finally {
      setUpdating(false);
    }
  };

  const canUpdateStatus = ['admin', 'lawyer'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Loading complaint...</p>
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Alert type="error" message={error} />
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Go back
        </button>
      </div>
    );
  }

  const sc = STATUS_CONFIG[complaint?.status] || { label: complaint?.status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 animate-fade-in pb-20">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {error   && <Alert type="error"   message={error} />}
      {success && <Alert type="success" message={success} />}

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-8">

        {/* Title & Status */}
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${sc.cls}`}>
              {sc.label}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {complaint?.title}
            </h1>
          </div>
          {complaint?.priority === 'critical' && (
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-100 text-red-600 h-fit">
              Critical Priority
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Tag,        label: 'Category',   value: complaint?.category },
            { icon: Building2,  label: 'Employer',   value: complaint?.employerInfo?.name || '—' },
            { icon: Clock,      label: 'Filed On',   value: new Date(complaint?.createdAt).toLocaleDateString() },
            { icon: User,       label: 'Filed By',   value: complaint?.worker?.firstName ? `${complaint.worker.firstName} ${complaint.worker.lastName}` : '—' },
          ].map((m, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
              <m.icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{m.label}</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Description</h2>
          <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
            {complaint?.description}
          </p>
        </div>

        {/* Evidence files if any */}
        {complaint?.evidence?.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Evidence</h2>
            <div className="flex flex-wrap gap-3">
              {complaint.evidence.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-bold text-primary hover:underline border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-full">
                  Document {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status Update — only for admin/lawyer */}
        {canUpdateStatus && (
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Update Status</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="modern-select flex-1 max-w-xs">
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === complaint.status}
                className="btn-primary max-w-[180px] py-3">
                {updating ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Update Status</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Officer Assignment — admin only */}
        {isAdmin && (
          <div className="pt-4 border-t border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Assign Legal Officer</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                className="modern-select flex-1 max-w-sm"
                disabled={officers.length === 0}
              >
                <option value="">
                  {officers.length === 0 ? "No active officers available" : "Select an officer..."}
                </option>
                {officers.map((o) => (
                  <option key={o._id || o.userId} value={o.userId || o._id}>
                    {(o.firstName || o.name || "Officer")}{o.lastName ? ` ${o.lastName}` : ''}
                    {o.specialization ? ` — ${o.specialization}` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssignOfficer}
                disabled={assigning || !selectedOfficerId}
                className="btn-primary max-w-[200px] py-3">
                {assigning ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Assigning...</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2" />Assign Officer</>
                )}
              </button>
            </div>
            {complaint?.assignedTo && (
              <p className="mt-3 text-[11px] font-bold text-slate-500">
                Currently assigned to: <span className="text-slate-800">{complaint.assignedTo?.firstName || complaint.assignedTo}</span>
              </p>
            )}
          </div>
        )}

        {/* Message Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center">
          <button
            onClick={() => navigate(`/messages?complaint=${complaint._id}`)}
            className="flex items-center gap-2 text-sm font-black text-primary hover:underline uppercase tracking-widest">
            <MessageSquare className="h-4 w-4" />
            Send Message About This Case
          </button>

          {isAdmin && (
            <button
              onClick={() => setDeleteOpen(true)}
              className="ml-auto flex items-center gap-2 text-sm font-black text-red-500 hover:text-red-700 uppercase tracking-widest"
            >
              <Trash2 className="h-4 w-4" />
              Delete complaint
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete complaint?"
        description="This permanently removes the complaint, its audit trail, and any associated attachments. This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleting}
      />
    </div>
  );
};

export default ComplaintDetailPage;