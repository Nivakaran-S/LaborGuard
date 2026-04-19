import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../contexts/complaint/AuthContext';
import { getMyComplaints } from '../../services/complaint/complaintService';
import ComplaintFilters from '../../components/complaints/ComplaintFilters';
import ComplaintList from '../../components/complaints/ComplaintList';
import EmptyState from '../../components/core/EmptyState';

const MyComplaintsPage = () => {
  const { profile } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMyComplaints({
        page: filters.page,
        limit: filters.limit
      });
      setComplaints(response.data.data.complaints || []);
      setPagination(response.data.data.pagination || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filters.page]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-bg-secondary p-4 md:p-8 xl:p-12">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-text-secondary">Worker complaint hub</p>
              <h1 className="text-3xl font-extrabold text-text-primary mt-3">My complaints</h1>
              <p className="text-text-secondary mt-2">Track your reported disputes and monitor progress from the LaborGuard dashboard.</p>
            </div>
            <Link to="/complaints/new" className="btn-primary w-full max-w-[220px] text-center">File new complaint</Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.45fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
              <ComplaintFilters filters={filters} onChange={setFilters} />
              {error && <div className="text-rose-600">{error}</div>}
              {loading ? (
                <div className="py-16 text-center text-text-secondary">Loading complaints...</div>
              ) : complaints.length ? (
                <ComplaintList complaints={complaints} role="worker" pagination={pagination} onPageChange={(page) => setFilters({ ...filters, page })} />
              ) : (
                <EmptyState title="No complaints yet" description="You haven’t filed a complaint yet. Submit a report and track its progress from this dashboard." />
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-extrabold text-text-primary mb-3">Welcome back{profile?.firstName ? `, ${profile.firstName}` : ''}</h2>
              <p className="text-text-secondary">Use this page to monitor every case you have open with LaborGuard. You can revisit details or submit a new issue at any time.</p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-8">
              <h3 className="text-lg font-bold text-text-primary mb-3">Frequently used</h3>
              <ul className="space-y-3 text-text-secondary">
                <li>• File a new complaint</li>
                <li>• Track status and dates</li>
                <li>• Review assigned legal officer updates</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MyComplaintsPage;
