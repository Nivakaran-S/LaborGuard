import { useNavigate } from 'react-router-dom';
import { Eye, Clock, Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending:      { label: 'Pending',    cls: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'In Review',  cls: 'bg-blue-100 text-blue-700' },
  resolved:     { label: 'Resolved',   cls: 'bg-green-100 text-green-700' },
  rejected:     { label: 'Rejected',   cls: 'bg-red-100 text-red-700' },
};

const ComplaintList = ({ complaints = [], role = 'worker', pagination, onPageChange }) => {
  const navigate = useNavigate();

  const getDetailPath = (id) => {
    if (role === 'admin')  return `/complaints/${id}`;
    if (role === 'lawyer') return `/legal/cases/${id}`;
    if (role === 'ngo')    return `/ngo/cases/${id}`;
    return `/worker/complaints/${id}`;
  };

  if (complaints.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400">
        <p className="text-sm font-bold">No complaints found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {complaints.map((c) => {
        const sc = STATUS_CONFIG[c.status] || { label: c.status, cls: 'bg-slate-100 text-slate-700' };
        return (
          <div key={c._id}
            className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group cursor-pointer"
            onClick={() => navigate(getDetailPath(c._id))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(getDetailPath(c._id))}>
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="text-sm font-black text-slate-900 truncate">{c.title}</h4>
                  <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", sc.cls)}>
                    {sc.label}
                  </span>
                  {c.priority === 'critical' && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-100 text-red-600">
                      Critical
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{c.description}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {c.organizationName && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <Building2 className="h-3 w-3" /> {c.organizationName}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <Eye className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (() => {
        const currentPage = pagination.page ?? pagination.currentPage ?? 1;
        return (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Page {currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500
                         hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    "h-9 w-9 rounded-full border text-xs font-black transition-all",
                    currentPage === page
                      ? "bg-primary border-primary text-white"
                      : "border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
                  )}>
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= pagination.totalPages}
              className="h-9 w-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-500
                         hover:border-primary hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default ComplaintList;