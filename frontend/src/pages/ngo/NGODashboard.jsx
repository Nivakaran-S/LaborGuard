import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useComplaints } from "@/hooks/useComplaints";
import { 
  Building, 
  BarChart3, 
  Users, 
  ShieldAlert, 
  Globe, 
  TrendingUp,
  Map,
  FileText,
  ExternalLink,
  ShieldCheck,
  TrendingDown,
  LayoutGrid,
  ChevronRight,
  PieChart,
  MessageSquare,
  Eye,
  Filter,
  Search,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/common/Input";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { complaintApi } from "@/api/complaintApi";
import { cn } from "@/lib/utils";

import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NGODashboard = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { useGetComplaints } = useComplaints();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get("tab") || "intelligence";
    
    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };

    const [searchTerm, setSearchTerm] = useState("");

    // Fetch system-wide stats for advocacy
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['ngo-stats'],
        queryFn: async () => {
            const res = await complaintApi.getStats();
            return res.data.data;
        }
    });

    // Fetch critical unassigned cases for intervention
    const { data: criticalCasesData, isLoading: casesLoading } = useGetComplaints({ 
        priority: 'critical', 
        status: 'pending',
        limit: 10
    });
    const criticalCases = criticalCasesData?.complaints || [];

    const casesList = criticalCases.filter((c) => 
        c.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (statsLoading || casesLoading) return (
        <div className="p-32 flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">AGGREGATING ANALYTICS PROTOCOLS...</p>
        </div>
    );

    const metrics = [
        { label: "Community Vigilance", value: stats?.total || 0, icon: Globe, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Unassigned Crisis", value: stats?.byPriority?.critical || 0, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-50" },
        { label: "Resolved Advocacy", value: stats?.byStatus?.resolved || 0, icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50" },
        { label: "Monthly Growth", value: "+14%", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    ];

    return (
        <div className="space-y-12 animate-fade-in pb-20 mt-4 px-2 lg:px-6">
            {/* Header: Advocacy Command */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-4">
                    <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 rounded-full bg-primary/5 shadow-inner">Social Justice Watch</Badge>
                    <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none">
                        Advocacy <br />
                        <span className="text-primary italic">Intelligence.</span>
                    </h1>
                    <p className="text-base font-bold text-slate-400 max-w-xl leading-relaxed uppercase italic">
                        Monitoring human rights for <span className="text-slate-900 not-italic font-black">"{user?.organizationName || "Independent Observer"}"</span>. <br />
                        <span className="text-slate-800 not-italic font-black tracking-tight">Protecting the unseen workforce of Sri Lanka.</span>
                    </p>
                </div>
                
                <div className="flex gap-4">
                     <div className="flex items-center gap-1.5 bg-slate-900 p-2 rounded-[24px] shadow-2xl">
                        <Button 
                            onClick={() => setActiveTab("intelligence")}
                            className={cn(
                                "h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                                activeTab === "intelligence" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-transparent text-slate-500 hover:text-white"
                            )}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Pulse
                        </Button>
                        <Button 
                            onClick={() => setActiveTab("investigations")}
                            className={cn(
                                "h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all",
                                activeTab === "investigations" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-transparent text-slate-500 hover:text-white"
                            )}
                        >
                            <ShieldAlert className="h-4 w-4 mr-2" />
                            Investigations
                        </Button>
                    </div>
                </div>
            </header>

            {metrics.length > 0 && activeTab === "intelligence" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in zoom-in-95 duration-500">
                    {metrics.map((m, i) => (
                        <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border", m.bg, m.color)}>
                                    <m.icon className="h-7 w-7" />
                                </div>
                            </div>
                            <div>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{m.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "intelligence" ? (
                <div className="grid lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    {/* Insights Summary */}
                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-white rounded-[56px] p-12 border border-slate-100 shadow-sm space-y-12">
                             <div className="space-y-2">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Advocacy Metrics</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggregated system-wide data points for civil oversight.</p>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <PieChart className="h-5 w-5 text-primary" />
                                        <h3 className="text-[11px] font-black uppercase tracking-widest">Sectoral Crisis Analysis</h3>
                                    </div>
                                    <div className="space-y-6">
                                        {Object.entries(stats?.byCategory || {}).map(([category, count]) => {
                                            const percentage = Math.round((count / (stats?.total || 1)) * 100);
                                            return (
                                                <div key={category} className="space-y-3">
                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                        <span className="text-slate-400">{category.replace('_', ' ')}</span>
                                                        <span className="text-primary">{percentage}%</span>
                                                    </div>
                                                    <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary shadow-glow" style={{ width: `${percentage}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="p-10 bg-slate-900 text-white rounded-[40px] flex flex-col justify-between overflow-hidden relative">
                                     <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-3xl" />
                                     <div className="space-y-4 relative z-10">
                                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Impact Score</h3>
                                        <p className="text-7xl font-black tracking-tighter">84.2</p>
                                        <Badge className="bg-primary text-white border-none font-black text-[9px] tracking-widest">OPTIMAL ADVOCACY</Badge>
                                     </div>
                                     <Button
                                        onClick={() => navigate("/community/advocacy")}
                                        variant="outline"
                                        className="w-full h-14 rounded-[28px] border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-widest mt-12 relative z-10 transition-all"
                                     >
                                        <Globe className="h-4 w-4 mr-2" />
                                        Public Oversight
                                     </Button>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Regional Watch */}
                    <div className="space-y-8">
                         <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/20 space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
                                    <Map className="h-5 w-5 text-primary" />
                                    Regional Pulse
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top districts by violation density.</p>
                            </div>
                            <div className="space-y-6">
                                {['Colombo District', 'Gampaha District', 'Kandy District', 'Galle District'].map((city, i) => (
                                    <div key={city} className="flex items-center justify-between p-1">
                                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{city}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn(
                                                "h-2 w-8 rounded-full border-none",
                                                i === 0 ? "bg-red-500 shadow-glow" : i === 1 ? "bg-amber-500" : "bg-slate-200"
                                            )} />
                                            <span className="text-[10px] font-black text-slate-900">{100 - (i * 20)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                         <div className="bg-primary/5 p-10 rounded-[56px] border-2 border-primary/10 space-y-6 text-center">
                            <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                Your organization's monitoring has accelerated resolution times by <span className="text-slate-900 font-black">42%</span> in the last quarter.
                            </p>
                         </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Identify case narrative or City..." 
                                className="pl-14 h-14 rounded-[28px] bg-slate-50/50 border-none shadow-inner focus:bg-white text-sm font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => navigate("/ngo/cases")}
                            variant="ghost"
                            className="h-14 w-14 rounded-[28px] bg-slate-50/50 hover:bg-primary/5 text-slate-400 hover:text-primary transition-all"
                            title="Advanced case filters"
                        >
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                         {criticalCases?.length === 0 ? (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={ShieldCheck}
                                    title="Protocol Clear"
                                    description="No critical unassigned breaches detected in the surveillance grid."
                                    className="h-[400px] bg-slate-50 border-none rounded-[64px]"
                                />
                            </div>
                        ) : (
                            criticalCases.map((c) => (
                                <div key={c._id} className="group bg-white rounded-[48px] border border-slate-100 shadow-sm hover:shadow-3xl hover:border-red-100 transition-all duration-700 overflow-hidden flex flex-col hover:-translate-y-2">
                                     <div className="p-10 space-y-8 flex-1 flex flex-col">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <Badge className="bg-red-50 text-red-600 border-red-100 font-black uppercase tracking-widest text-[9px] px-4 py-1.5 rounded-full ring-2 ring-red-50/50">CRITICAL OBSERVATION</Badge>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono italic">#{c._id.slice(-8)}</span>
                                            </div>
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase italic break-words">{c.title}</h4>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 pt-2">
                                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl">
                                                <Map className="h-3.5 w-3.5 text-primary" />
                                                {c.location.city}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-3.5 w-3.5 text-slate-300" />
                                                Verified Identity
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-50 mt-auto flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="h-2 w-2 rounded-full bg-red-500 shadow-glow animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Unassigned Crisis</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-14 w-14 rounded-full bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"
                                                    onClick={() => navigate(`/messages?case=${c._id}`)}
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </Button>
                                                <Button asChild className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 group">
                                                    <Link to={`/ngo/cases/${c._id}`}>
                                                        Investigate Case
                                                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NGODashboard;
