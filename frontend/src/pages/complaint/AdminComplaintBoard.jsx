import { useEffect, useState } from 'react';
import { getAllComplaints, getComplaintStats } from '../../services/complaint/complaintService';
import ComplaintFilters from '../../components/complaints/ComplaintFilters';
import ComplaintList from '../../components/complaints/ComplaintList';
import EmptyState from '../../components/core/EmptyState';
import { RefreshCw } from 'lucide-react';

const AdminComplaintBoard = () => {
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 10 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const response = await getComplaintStats();
      setStats(response.data.data);
    } catch {
      setStats(null);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getAllComplaints({
        page: filters.page,
        limit: filters.limit,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });
      setComplaints(response.data.data.complaints || []);
      setPagination(response.data.data.pagination || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  // FIX: re-fetch on any filter change (was only re-fetching on page change)
  useEffect(() => { fetchComplaints(); }, [filters.page, filters.status, filters.search]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 p-4 md:p-8 xl:p-12">
      <div className="max-w-[1400px] mx-auto space-y-8">

        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">Admin Console</p>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Complaint Management</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                Review and manage all incoming complaints across the platform.
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

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total',        value: stats?.total || 0 },
            { label: 'Pending',      value: stats?.byStatus?.pending || 0 },
            { label: 'Under Review', value: stats?.byStatus?.under_review || 0 },
            { label: 'Resolved',     value: stats?.byStatus?.resolved || 0 },
          ].map((s, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{s.label}</p>
              <div className="mt-4 text-3xl font-extrabold text-slate-900">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
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
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Loading complaints...</p>
            </div>
          ) : complaints.length ? (
            <ComplaintList
              complaints={complaints}
              role="admin"
              pagination={pagination}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          ) : (
            <EmptyState
              title="No complaints found"
              description="There are no complaints matching the current filters."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminComplaintBoard;