import { useState } from "react";
import { useComplaints } from "@/hooks/useComplaints";
import { ComplaintCard } from "@/components/complaint/ComplaintCard";
import { 
  Filter, 
  Search, 
  PlusCircle, 
  FileText, 
  ChevronDown,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { Spinner } from "@/components/common/Spinner";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const MyComplaints = () => {
  const navigate = useNavigate();
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    status: "",
    category: "",
    search: "",
    sort: "-createdAt"
  });

  const { useGetMyComplaints } = useComplaints();
  const { data, isLoading } = useGetMyComplaints(params);

  const complaints = data?.complaints || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const handlePageChange = (page) => {
    setParams({ ...params, page });
  };

  const categories = [
    { value: "wage_theft", label: "Wage Theft" },
    { value: "unsafe_conditions", label: "Unsafe Conditions" },
    { value: "wrongful_termination", label: "Wrongful Termination" },
    { value: "harassment", label: "Harassment" },
    { value: "discrimination", label: "Discrimination" },
    { value: "unpaid_overtime", label: "Unpaid Overtime" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-widest text-[9px]">Dispute Resolution</Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">My Complaints</h1>
          <p className="text-sm font-bold text-slate-500 max-w-lg">Track and manage your labor rights cases in real-time.</p>
        </div>
        <Button asChild className="rounded-full px-8 h-12 shadow-lg shadow-primary/20">
          <Link to="/complaints/new" className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            File New Case
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
                placeholder="Search cases by title or details..." 
                className="pl-11 rounded-2xl h-11 border-none bg-slate-50/50 focus-visible:ring-primary/20 shadow-inner"
                onChange={(e) => setParams({ ...params, search: e.target.value, page: 1 })}
            />
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
            <select 
                className={cn(
                    "flex-1 lg:w-44 h-11 rounded-2xl border-none bg-slate-50/50 px-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none transition-all",
                    params.status ? "text-primary ring-2 ring-primary/20" : ""
                )}
                onChange={(e) => setParams({ ...params, status: e.target.value, page: 1 })}
            >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
            </select>

            <select 
                className={cn(
                    "flex-1 lg:w-44 h-11 rounded-2xl border-none bg-slate-50/50 px-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none transition-all",
                    params.category ? "text-primary ring-2 ring-primary/20" : ""
                )}
                onChange={(e) => setParams({ ...params, category: e.target.value, page: 1 })}
            >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>

            <select 
                className="flex-1 lg:w-44 h-11 rounded-2xl border-none bg-slate-50/50 px-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none transition-all"
                onChange={(e) => setParams({ ...params, sort: e.target.value, page: 1 })}
            >
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="-priority">High Priority First</option>
            </select>
        </div>
      </div>

      <div className="min-h-[400px] flex flex-col gap-4">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <Spinner size="lg" />
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">Loading Case File...</p>
          </div>
        ) : complaints.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-4">
              {complaints.map((c) => (
                <ComplaintCard key={c._id} complaint={c} />
              ))}
            </div>
            
            <div className="pt-10">
              <Pagination 
                currentPage={params.page} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={FileText}
            title="No cases found"
            description={params.search || params.status || params.category 
              ? "Try adjusting your filters to find what you're looking for." 
              : "You haven't filed any complaints yet. If your labor rights were violated, we can help."}
            action={!(params.search || params.status || params.category) ? {
              label: "Get Help Now",
              onClick: () => navigate("/worker/complaints/new")
            } : null}
            className="flex-1"
          />
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
