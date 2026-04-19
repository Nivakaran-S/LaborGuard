import { useState } from "react";
import { useComplaints } from "@/hooks/useComplaints";
import { complaintApi } from "@/api/complaintApi";
import { Link } from "react-router-dom";
import {
  ShieldAlert, Search, Filter, Map, ChevronRight,
  MessageSquare, ShieldCheck, Eye
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  critical: { label: "Critical", class: "bg-red-50 text-red-600 border-red-100" },
  high:     { label: "High",     class: "bg-orange-50 text-orange-600 border-orange-100" },
  medium:   { label: "Medium",   class: "bg-amber-50 text-amber-600 border-amber-100" },
  low:      { label: "Low",      class: "bg-slate-50 text-slate-600 border-slate-100" },
};

const NGOCasesPage = () => {
  const { useGetComplaints } = useComplaints();
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { data: casesData, isLoading } = useGetComplaints({
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    status: "pending",
  });
  const cases = casesData?.complaints || [];

  const filtered = cases?.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading)
    return (
      <div className="p-32 flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">
          SCANNING ACTIVE CASES...
        </p>
      </div>
    );

  return (
    <div className="space-y-10 animate-fade-in pb-20 mt-4 px-2 lg:px-6">
      <header className="space-y-4">
        <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 rounded-full bg-primary/5">
          Case Investigations
        </Badge>
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
          Active <span className="text-primary italic">Cases.</span>
        </h1>
        <p className="text-sm font-bold text-slate-400 max-w-xl uppercase italic">
          Unassigned critical violations requiring NGO oversight and intervention.
        </p>
      </header>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search by case title or city..."
            className="pl-14 h-14 rounded-[28px] bg-slate-50/50 border-none shadow-inner focus:bg-white text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="h-14 w-full lg:w-52 rounded-[28px] border-none bg-slate-50/50 px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button
          onClick={() => { setSearchTerm(""); setPriorityFilter("all"); }}
          variant="ghost"
          className="h-14 w-14 rounded-[28px] bg-slate-50/50 hover:bg-primary/5 text-slate-400 hover:text-primary transition-all"
          title="Reset filters"
        >
          <Filter className="h-5 w-5" />
        </Button>
      </div>

      {/* Cases Grid */}
      {filtered?.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No Active Cases"
          description="No unassigned cases matching your filters were found."
          className="h-[400px] bg-slate-50 border-none rounded-[64px]"
        />
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {filtered?.map((c) => {
            const priority = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.low;
            return (
              <div
                key={c._id}
                className="group bg-white rounded-[48px] border border-slate-100 shadow-sm hover:shadow-3xl hover:border-primary/20 transition-all duration-700 flex flex-col hover:-translate-y-2 overflow-hidden"
              >
                <div className="p-10 space-y-8 flex-1 flex flex-col">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <Badge className={cn("font-black uppercase tracking-widest text-[9px] px-4 py-1.5 rounded-full ring-2 ring-offset-1", priority.class)}>
                        {priority.label} Priority
                      </Badge>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono italic">
                        #{c._id.slice(-8)}
                      </span>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase italic break-words">
                      {c.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl">
                      <Map className="h-3.5 w-3.5 text-primary" />
                      {c.location?.city || "Unknown"}
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5 text-slate-300" />
                      {c.category?.replace("_", " ") || "General"}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-50 mt-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                        Pending Assignment
                      </span>
                    </div>
                    <Button
                      asChild
                      className="h-14 px-8 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 group"
                    >
                      <Link to={`/ngo/cases/${c._id}`}>
                        View Case
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NGOCasesPage;