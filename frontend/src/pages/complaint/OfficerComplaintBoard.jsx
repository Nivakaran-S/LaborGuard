import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAssignedComplaints } from '../../services/complaint/complaintService';
import ComplaintFilters from '../../components/complaints/ComplaintFilters';
import ComplaintList from '../../components/complaints/ComplaintList';
import EmptyState from '../../components/core/EmptyState';
import { RefreshCw } from 'lucide-react';

const OfficerComplaintBoard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAssignedComplaints({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        search: filters.search || undefined,
        assignedTo: user?.userId,
      });
      setComplaints(response.data.data.complaints || []);
      setPagination(response.data.data.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  };

  // FIX: Added all filter deps so list refreshes on status/search changes
  useEffect(() => { fetchComplaints(); }, [filters.page, filters.status, filters.search]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 md:p-8 xl:p-12">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Officer Console</p>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Assigned Cases</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Your active case docket as a Legal Officer.
              </p>
            </div>
            <button
              onClick={fetchComplaints}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-slate-200 text-xs font-black
                         uppercase tracking-widest text-slate-500 hover:border-primary hover:text-primary
                         disabled:opacity-50 transition-all">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Complaint Feed */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <ComplaintFilters filters={filters} onChange={setFilters} />

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600 font-bold">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Loading cases...</p>
            </div>
          ) : complaints.length ? (
            <ComplaintList
              complaints={complaints}
              role="lawyer"
              pagination={pagination}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          ) : (
            <EmptyState
              title="No assigned cases"
              description="You have no complaints assigned to your docket matching the current filters."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerComplaintBoard;