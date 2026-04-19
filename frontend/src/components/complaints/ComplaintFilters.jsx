import { Search, SlidersHorizontal } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '',             label: 'All Statuses' },
  { value: 'pending',      label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'resolved',     label: 'Resolved' },
  { value: 'rejected',     label: 'Rejected' },
];

const ComplaintFilters = ({ filters, onChange }) => {
  const handleSearch = (e) => {
    e.preventDefault();
    // FIX: trigger fetchComplaints from parent via onChange — parent calls fetch in useEffect
    onChange({ ...filters, search: filters.search, page: 1 });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search complaints by keyword..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value, page: 1 })}
          className="modern-input pl-11 pr-4 py-3 text-sm"
        />
      </form>

      {/* Status Filter */}
      <div className="relative">
        <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value, page: 1 })}
          className="modern-select pl-11 pr-10 py-3 text-sm md:w-48">
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ComplaintFilters;