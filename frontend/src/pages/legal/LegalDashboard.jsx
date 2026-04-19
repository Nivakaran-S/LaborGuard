import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/hooks/useComplaints";
import {
  Gavel, Clock, CheckCircle2, AlertCircle, Search, Filter,
  Eye, MessageSquare, FileBarChart, User as UserIcon, ShieldAlert,
  Calendar, Briefcase, TrendingDown, TrendingUp, // FIX: TrendingUp was missing — caused crash
  LayoutGrid, ChevronRight, MoreVertical, Download, Building2
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/Select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const LegalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { useGetComplaints, downloadReport } = useComplaints();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: complaintsData, isLoading } = useGetComplaints({
    assignedTo: user.id,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const complaints = complaintsData?.complaints || [];

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':      return { label: 'Pending',    class: 'bg-amber-100 text-amber-700' };
      case 'under_review': return { label: 'In Review',  class: 'bg-blue-100 text-blue-700' };
      case 'resolved':     return { label: 'Resolved',   class: 'bg-green-100 text-green-700' };
      case 'rejected':     return { label: 'Rejected',   class: 'bg-red-100 text-red-700' };
      default:             return { label: status,       class: 'bg-slate-100 text-slate-700' };
    }
  };

  const filteredComplaints = complaints?.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.organizationName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  if (isLoading) return (
    <div className="p-32 flex flex-col items-center">
      <Spinner size="lg" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
        DOCKET SYNCHRONIZATION...
      </p>
    </div>
  );

  const stats = [
    { label: "Active Docket",     value: complaints.length || 0,                                     icon: Gavel,      color: "text-primary",    bg: "bg-primary/10" },
    { label: "Critical Priority", value: complaints.filter(c => c.priority === 'critical').length || 0, icon: ShieldAlert, color: "text-red-500",    bg: "bg-red-50" },
    { label: "Upcoming Consults", value: "--",                                                          icon: Calendar,   color: "text-blue-500",   bg: "bg-blue-50" },
    { label: "Resolution Rate",   value: "84%",                                                         icon: TrendingUp, color: "text-green-500",  bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-12 animate-fade-in pb-20 mt-4">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-4">
        <div className="space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full bg-primary/5">
            Justice Protocol v4.0
          </Badge>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Case Management<br />
            <span className="text-primary italic">Legal Dashboard.</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 max-w-lg leading-relaxed uppercase italic">
            Assigned docket for {user?.firstName} {user?.lastName} — Legal Officer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="h-12 px-6 rounded-full font-black uppercase tracking-widest text-[10px] border-2 border-slate-200 hover:border-primary hover:text-primary transition-all"
            onClick={() => downloadReport?.mutate()}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", s.bg)}>
              <s.icon className={cn("h-5 w-5", s.color)} />
            </div>
            <div>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 px-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by case title or employer name..."
            className="pl-11 h-12 rounded-2xl bg-slate-50 border-slate-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48 h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold text-sm">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all">All Cases</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Case List */}
      <div className="px-4 space-y-4">
        {filteredComplaints.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title="No cases found"
            description="Your assigned docket is empty or no cases match the current filters."
          />
        ) : (
          filteredComplaints.map((complaint) => {
            const sc = getStatusConfig(complaint.status);
            return (
              <div key={complaint._id}
                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-black text-slate-900 truncate">{complaint.title}</h3>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full", sc.class)}>
                        {sc.label}
                      </span>
                      {complaint.priority === 'critical' && (
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-100 text-red-600">
                          Critical
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      {complaint.organizationName && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <Building2 className="h-3.5 w-3.5" />
                          {complaint.organizationName}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-1">
                      {complaint.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-10 px-5 rounded-full font-black uppercase tracking-widest text-[10px] border-2 hover:border-primary hover:text-primary transition-all"
                      onClick={() => navigate(`/legal/cases/${complaint._id}`)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-10 px-5 rounded-full font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 hover:text-primary transition-all"
                      onClick={() => navigate(`/messages?complaint=${complaint._id}`)}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LegalDashboard;