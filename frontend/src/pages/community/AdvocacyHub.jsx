import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  MapPin,
  TrendingUp,
  Users,
  ShieldCheck,
  Globe,
  Target,
  ArrowRight,
  TrendingDown,
  LayoutGrid,
  ChevronRight,
  Flag,
  Landmark,
  PieChart,
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  MessageSquare,
  FileBarChart2 as FileBarChart,
  Quote
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/hooks/useCommunity";
import { StoryCard } from "@/components/community/StoryCard";
import { toast } from "sonner";

const AdvocacyHub = () => {
    const navigate = useNavigate();
    const { useGetTrending, likePost, sharePost } = useCommunity();
    const { data: trending = [] } = useGetTrending();
    const featuredStories = trending.slice(0, 3);

    const handleRegionalComparison = () => {
        navigate("/community/explore");
    };

    const handleDownloadReport = () => {
        toast.success("Preparing national report...");
        if (typeof window !== "undefined") {
            setTimeout(() => window.print(), 300);
        }
    };

    const handleRegisterOrg = () => {
        navigate("/register?role=ngo");
    };

    const handleViewLedger = () => {
        navigate("/community/explore");
    };

    // Mock regional data for transparency
    const regions = [
        { name: "Colombo District", violations: 242, resolved: 84, trend: 'up' },
        { name: "Gampaha District", violations: 156, resolved: 92, trend: 'down' },
        { name: "Kandy District", violations: 89, resolved: 45, trend: 'stable' },
        { name: "Jaffna District", violations: 64, resolved: 78, trend: 'up' },
    ];

    const sectors = [
        { name: "Apparel & Textile", count: 421, gravity: 85 },
        { name: "Construction", count: 289, gravity: 72 },
        { name: "Tea & Plantations", count: 184, gravity: 94 },
        { name: "Domestic Service", count: 156, gravity: 98 },
    ];

    return (
        <div className="space-y-20 animate-fade-in pb-32 mt-4 px-2 lg:px-6">
            {/* Immersive Hero: Transparency Protocol */}
            <header className="relative space-y-8 py-20 text-center max-w-4xl mx-auto overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative z-10 space-y-6">
                    <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.3em] text-[10px] px-6 py-2 rounded-full bg-primary/5 shadow-inner">Public Oversight Hub</Badge>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 leading-none">
                        Advocacy <br />
                        <span className="text-primary italic">Transparency.</span>
                    </h1>
                    <p className="text-xl font-bold text-slate-400 max-w-2xl mx-auto leading-relaxed uppercase italic">
                        Visualizing the state of labor rights in Sri Lanka. <br />
                        <span className="text-slate-900 not-italic font-black">Data-driven accountability for a fair workforce.</span>
                    </p>
                </div>
                <div className="relative z-10 flex flex-wrap justify-center gap-6 pt-6 font-black uppercase tracking-widest text-[10px] text-slate-400">
                    <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-glow" /> 
                        84% Resolution Efficiency
                    </div>
                    <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm">
                        <Activity className="h-4 w-4 text-primary" />
                        Live Monitoring Active
                    </div>
                </div>
            </header>

            {/* Strategic Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-slate-900 text-white rounded-[56px] p-12 border-none shadow-3xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] group-hover:scale-150 transition-transform duration-700" />
                     <CardContent className="p-0 space-y-10 relative z-10">
                        <div className="space-y-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Global Protection Index</h3>
                            <div className="flex items-end gap-3">
                                <span className="text-6xl font-black tracking-tighter">74.2</span>
                                <Badge className="bg-primary text-white border-none font-black text-[10px] mb-2 px-3 py-1">+2.4%</Badge>
                            </div>
                        </div>
                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">System Stability</span>
                                <span className="text-primary">Optimized</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary shadow-glow transition-all duration-1000" style={{ width: '74%' }} />
                            </div>
                        </div>
                        <Button
                            onClick={handleRegionalComparison}
                            variant="outline"
                            className="w-full h-14 rounded-[32px] border-white/10 text-white hover:bg-white/5 text-[9px] font-black uppercase tracking-widest"
                        >
                            <Globe className="h-4 w-4 mr-2" />
                            Regional Comparison
                        </Button>
                     </CardContent>
                </Card>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[
                        { label: "Resolved Disputes", value: "12,482", icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50" },
                        { label: "Open Investigations", value: "1,842", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
                        { label: "Active Legal Officers", value: "148", icon: Landmark, color: "text-blue-500", bg: "bg-blue-50" },
                        { label: "Participating NGOs", value: "32", icon: Building2, color: "text-primary", bg: "bg-primary/10" },
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all duration-500">
                             <div className="flex justify-between items-start mb-6">
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border", s.bg, s.color)}>
                                    <s.icon className="h-7 w-7" />
                                </div>
                             </div>
                             <div>
                                <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{s.value}</p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                             </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Regional Hotspots & Sector Analysis */}
            <div className="grid lg:grid-cols-2 gap-12">
                {/* Hotspot Registry */}
                <div className="space-y-8">
                    <div className="flex justify-between items-center px-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Regional Hotspots</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Heatmap of labor violations by district.</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm overflow-hidden p-4">
                        {regions.map((r, i) => (
                            <div key={i} className="group p-8 flex items-center justify-between hover:bg-slate-50 transition-all rounded-[40px]">
                                <div className="flex items-center gap-6">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black uppercase shadow-lg group-hover:bg-primary transition-colors">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-slate-900 tracking-tight">{r.name}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r.violations} Active Reports</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        <p className="text-lg font-black text-slate-900 tracking-tighter">{r.resolved}%</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-green-500">Resolved</p>
                                    </div>
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex items-center justify-center",
                                        r.trend === 'up' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
                                    )}>
                                        {r.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sector Severity Radar */}
                <div className="space-y-8">
                     <div className="flex justify-between items-center px-4">
                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Sector Severity</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggregated risk profiles by industrial sector.</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[56px] p-12 text-white space-y-10 relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[100px]" />
                        <div className="space-y-10">
                            {sectors.map((s, i) => (
                                <div key={i} className="space-y-4">
                                     <div className="flex justify-between items-end">
                                         <div>
                                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{s.count} Data Points</p>
                                            <h4 className="text-xl font-black tracking-tight">{s.name}</h4>
                                         </div>
                                         <span className="text-2xl font-black tracking-tighter text-primary">{s.gravity}% <span className="text-[10px] uppercase text-slate-500 italic font-bold">Severity</span></span>
                                     </div>
                                     <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className={cn("h-full shadow-glow transition-all duration-1000", s.gravity > 90 ? "bg-red-500" : "bg-primary")} 
                                            style={{ width: `${s.gravity}%` }} 
                                        />
                                     </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            onClick={handleDownloadReport}
                            className="w-full h-16 rounded-[32px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 group"
                        >
                            <FileBarChart className="h-4 w-4 mr-2" />
                            Download National Report
                        </Button>
                    </div>
                </div>
            </div>

            {/* Community Voices */}
            {featuredStories.length > 0 && (
              <div className="space-y-8">
                <div className="text-center space-y-3">
                  <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.3em] text-[10px] px-6 py-2 rounded-full bg-primary/5">
                    <Quote className="h-3 w-3 mr-2" />
                    Community Voices
                  </Badge>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Worker Testimonies</h2>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 max-w-xl mx-auto">
                    Real stories from workers across Sri Lanka.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredStories.map((story) => (
                    <StoryCard
                      key={story._id}
                      story={story}
                      onLike={(id) => likePost.mutate(id)}
                      onComment={() => navigate("/community")}
                      onShare={(id) => sharePost.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Advocacy Call to Action */}
            <div className="bg-primary/5 rounded-[56px] border-2 border-primary/20 p-20 text-center space-y-10 relative overflow-hidden">
                 <div className="space-y-4 relative z-10">
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">Are you an NGO? <br /> <span className="text-primary italic">Join the Vigilance.</span></h2>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest max-w-2xl mx-auto italic">
                        Access raw datasets, intervention protocols, and collaborative case management by joining our certified advocacy network.
                    </p>
                 </div>
                 <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                    <Button
                        onClick={handleRegisterOrg}
                        className="h-16 px-12 rounded-full font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30"
                    >
                        Register Organization
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                        onClick={handleViewLedger}
                        variant="outline"
                        className="h-16 px-12 rounded-full font-black uppercase tracking-widest text-[11px] bg-white border-2 border-slate-100 hover:bg-slate-50"
                    >
                        View Public Ledger
                    </Button>
                 </div>
            </div>
        </div>
    );
};

export default AdvocacyHub;
