import { useQuery } from "@tanstack/react-query";
import { complaintApi } from "@/api/complaintApi";
import { FileText, Download, Calendar, Filter, Search } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NGOReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Reuse complaint listing as the basis for report generation
  const { data: cases, isLoading } = useQuery({
    queryKey: ["ngo-reports-cases"],
    queryFn: async () => {
      const res = await complaintApi.getAllComplaints({ limit: 50, status: "resolved" });
      const body = res.data.data;
      return Array.isArray(body) ? body : body?.complaints || [];
    },
  });

  const filtered = cases?.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (!filtered?.length) return;
    const csv = [
      ["Case ID", "Title", "Category", "Priority", "Status", "City", "Filed Date"],
      ...filtered.map((c) => [
        c._id,
        `"${c.title}"`,
        c.category || "",
        c.priority || "",
        c.status || "",
        c.location?.city || "",
        new Date(c.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laborguard-ngo-report-${Date.now()}.csv`;
    a.click();
  };

  if (isLoading)
    return (
      <div className="p-32 flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">
          GENERATING REPORT ARCHIVE...
        </p>
      </div>
    );

  return (
    <div className="space-y-10 animate-fade-in pb-20 mt-4 px-2 lg:px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
          <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 rounded-full bg-primary/5">
            Case Reports
          </Badge>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
            Report <span className="text-primary italic">Archive.</span>
          </h1>
          <p className="text-sm font-bold text-slate-400 max-w-xl uppercase italic">
            Export resolved case data for advocacy reports and government submissions.
          </p>
        </div>
        <Button
          onClick={handleExport}
          className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20"
          disabled={!filtered?.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV ({filtered?.length || 0} cases)
        </Button>
      </header>

      {/* Search */}
      <div className="bg-white p-6 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Filter resolved cases..."
            className="pl-14 h-14 rounded-[28px] bg-slate-50/50 border-none shadow-inner focus:bg-white text-sm font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {!filtered?.length ? (
        <EmptyState
          icon={FileText}
          title="No Resolved Cases"
          description="No resolved cases are available for reporting yet."
          className="h-[400px] bg-slate-50 border-none rounded-[64px]"
        />
      ) : (
        <div className="bg-white rounded-[48px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Case ID", "Title", "Category", "Priority", "City", "Filed"].map((h) => (
                    <th key={h} className="text-left px-8 py-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c._id} className={cn("border-b border-slate-50 hover:bg-slate-50/50 transition-colors", i % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-300 font-mono">
                      #{c._id.slice(-8)}
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-700 max-w-[200px] truncate">
                      {c.title}
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {c.category?.replace(/_/g, " ") || "—"}
                    </td>
                    <td className="px-8 py-5">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase tracking-widest border-none",
                        c.priority === "critical" ? "bg-red-50 text-red-600" :
                        c.priority === "high" ? "bg-orange-50 text-orange-600" :
                        "bg-slate-100 text-slate-600"
                      )}>
                        {c.priority || "—"}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {c.location?.city || "—"}
                    </td>
                    <td className="px-8 py-5 text-[10px] font-black text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGOReportsPage;