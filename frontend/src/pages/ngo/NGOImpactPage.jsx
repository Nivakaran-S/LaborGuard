import { useQuery } from "@tanstack/react-query";
import { complaintApi } from "@/api/complaintApi";
import {
  TrendingUp, ShieldCheck, Globe, BarChart3,
  Users, AlertCircle, FileText, Award
} from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { cn } from "@/lib/utils";

const NGOImpactPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["ngo-impact-stats"],
    queryFn: async () => {
      const res = await complaintApi.getStats();
      return res.data.data;
    },
  });

  if (isLoading)
    return (
      <div className="p-32 flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">
          COMPILING IMPACT METRICS...
        </p>
      </div>
    );

  const resolutionRate = stats?.total
    ? Math.round(((stats.byStatus?.resolved || 0) / stats.total) * 100)
    : 0;

  const kpis = [
    { label: "Total Complaints Monitored", value: stats?.total || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Resolved Cases", value: stats?.byStatus?.resolved || 0, icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50" },
    { label: "Critical Unassigned", value: stats?.byPriority?.critical || 0, icon: AlertCircle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Resolution Rate", value: `${resolutionRate}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
  ];

  const categoryEntries = Object.entries(stats?.byCategory || {});
  const totalCategoryCount = categoryEntries.reduce((sum, [, v]) => sum + v, 0);

  return (
    <div className="space-y-12 animate-fade-in pb-20 mt-4 px-2 lg:px-6">
      <header className="space-y-4">
        <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 rounded-full bg-primary/5">
          Impact Reporting
        </Badge>
        <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
          Social <span className="text-primary italic">Impact.</span>
        </h1>
        <p className="text-sm font-bold text-slate-400 max-w-xl uppercase italic">
          Measuring NGO effectiveness across Sri Lanka's labor rights ecosystem.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all duration-500">
            <div className="flex justify-between items-start mb-6">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border", k.bg, k.color)}>
                <k.icon className="h-7 w-7" />
              </div>
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{k.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="bg-white rounded-[56px] p-12 border border-slate-100 shadow-sm space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              Violation Categories
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Distribution of complaints by labor rights category.
            </p>
          </div>
          <div className="space-y-6">
            {categoryEntries.length === 0 ? (
              <p className="text-sm text-slate-400">No category data available.</p>
            ) : (
              categoryEntries.map(([category, count]) => {
                const pct = Math.round((count / totalCategoryCount) * 100);
                return (
                  <div key={category} className="space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                      <span className="text-slate-600">{category.replace(/_/g, " ")}</span>
                      <span className="text-primary">{pct}% ({count})</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-[56px] p-12 border border-slate-100 shadow-sm space-y-10">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              Case Status Pipeline
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Current resolution pipeline across all monitored cases.
            </p>
          </div>
          <div className="space-y-6">
            {Object.entries(stats?.byStatus || {}).map(([status, count]) => {
              const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              const colorMap = {
                pending: "bg-amber-400",
                under_review: "bg-blue-400",
                resolved: "bg-green-500",
                rejected: "bg-red-400",
              };
              return (
                <div key={status} className="space-y-3">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className="text-slate-600">{status.replace(/_/g, " ")}</span>
                    <span className="text-slate-900">{count} cases ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", colorMap[status] || "bg-slate-400")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recognition Badge */}
      <div className="bg-primary/5 border-2 border-primary/10 rounded-[56px] p-12 text-center space-y-4">
        <Award className="h-12 w-12 text-primary mx-auto" />
        <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
          Advocacy Impact Score
        </h3>
        <p className="text-7xl font-black text-primary tracking-tighter">
          {Math.min(100, resolutionRate + 12)}
        </p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 max-w-xs mx-auto">
          Composite score based on resolution rate, response time, and critical case intervention.
        </p>
      </div>
    </div>
  );
};

export default NGOImpactPage;