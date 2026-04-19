import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useJobs } from "@/hooks/useJobs";
import { 
  Building2, 
  Briefcase, 
  Users, 
  PlusCircle, 
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  Edit,
  Clock,
  TrendingUp,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  MessageSquare,
  Globe,
  Bell
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/utils";

const EmployerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { useGetEmployerJobs, useGetEmployerApplications, deleteJob } = useJobs();
    const [searchTerm, setSearchTerm] = useState("");

    const { data: jobs, isLoading: jobsLoading } = useGetEmployerJobs();
    const { data: applications = [] } = useGetEmployerApplications();
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    const filteredJobs = jobs?.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (jobsLoading) return (
        <div className="flex flex-col items-center justify-center p-32">
            <Spinner size="lg" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono text-center">ACCESSING EMPLOYER VAULT...</p>
        </div>
    );

    const totalApps = applications.length;
    const acceptedApps = applications.filter((a) => a.status === "accepted").length;
    const reviewedApps = applications.filter((a) => a.status === "accepted" || a.status === "rejected").length;
    const resolutionRate = totalApps > 0 ? Math.round((reviewedApps / totalApps) * 100) : 0;

    const stats = [
        { label: "Active Postings",    value: jobs?.length || 0, icon: Briefcase,    color: "text-primary",  bg: "bg-primary/10" },
        { label: "Total Applications", value: totalApps,         icon: Users,        color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Hired Workers",      value: acceptedApps,      icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
        { label: "Review Rate",        value: `${resolutionRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50" },
    ];

    const appsByJob = applications.reduce((acc, a) => {
        const jid = a.jobId?._id || a.jobId;
        acc[jid] = (acc[jid] || 0) + (a.status === "pending" ? 1 : 0);
        return acc;
    }, {});

    return (
        <div className="space-y-12 animate-fade-in pb-20 mt-4">
            {/* Header: Command Center */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 px-4">
                <div className="space-y-3">
                    <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full bg-primary/5">Corporate Shield</Badge>
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-tight">
                        Recruitment <br />
                        <span className="text-primary italic">Command Center.</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-400 max-w-lg leading-relaxed uppercase italic">
                        Managing vacancies for <span className="text-slate-800 not-italic font-black">"{user?.organizationName || user?.email}"</span>
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <Button asChild size="lg" className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30">
                        <Link to="/employer/jobs/new">
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Post New Vacancy
                        </Link>
                    </Button>
                </div>
            </header>

            {/* Stats Ecosystem */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 group hover:border-primary/20 transition-all duration-500">
                        <div className="flex justify-between items-start mb-6">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", s.bg, s.color)}>
                                <s.icon className="h-6 w-6" />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                                <ArrowUpRight className="h-4 w-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{s.value}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List & Search */}
            <div className="space-y-8 px-2">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                            <BarChart3 className="h-5 w-5" />
                         </div>
                         <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Listings</h2>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="Filter your vacancies..." 
                            className="pl-14 h-14 rounded-2xl bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-primary/10 text-sm font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {filteredJobs?.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="No vacancies posted yet"
                        description="Start your first recruitment cycle to find verified and reliable workers for your projects."
                        className="h-[400px] bg-slate-50 border-none rounded-[56px]"
                    >
                         <Button asChild className="rounded-full px-10 h-14 mt-4 font-black uppercase tracking-widest text-xs">
                            <Link to="/employer/jobs/new">Create First Job</Link>
                         </Button>
                    </EmptyState>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredJobs?.map((job) => (
                            <div key={job._id} className="group bg-white rounded-[32px] border border-slate-100 p-2 hover:shadow-2xl hover:border-primary/20 transition-all duration-500 overflow-hidden shadow-sm">
                                <div className="flex flex-col md:flex-row items-stretch md:items-center">
                                    <div 
                                        className="w-full md:w-32 h-32 rounded-[24px] bg-cover bg-center shrink-0 grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" 
                                        style={{ backgroundImage: `url(${job.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop'})` }}
                                    />
                                    
                                    <div className="p-6 md:px-8 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
                                                    {job.jobType.replace('-', ' ')}
                                                </Badge>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">#{job._id.slice(-6)}</span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight">{job.title}</h4>
                                            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl">
                                                    <Users className="h-3 w-3" />
                                                    Pending: {appsByJob[job._id] || 0}
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl">
                                                    <Clock className="h-3 w-3" />
                                                    Posted {new Date(job.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <Button 
                                                onClick={() => navigate(`/employer/jobs/${job._id}`)}
                                                className="flex-1 md:flex-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 border-slate-100 bg-white text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all"
                                            >
                                                Review Applicants
                                            </Button>
                                            
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-slate-50 hover:bg-primary/5 text-slate-400 hover:text-primary">
                                                        <MoreVertical className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-[24px] border border-slate-100 shadow-2xl">
                                                    <DropdownMenuItem 
                                                        className="p-4 rounded-xl font-black uppercase tracking-widest text-[9px] cursor-pointer hover:bg-slate-50"
                                                        onClick={() => navigate(`/employer/jobs/${job._id}/edit`)}
                                                    >
                                                        <Edit className="h-4 w-4 mr-3 text-slate-400" />
                                                        Update Posting
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="p-4 rounded-xl font-black uppercase tracking-widest text-[9px] cursor-pointer text-destructive hover:bg-red-50"
                                                        onClick={() => setPendingDeleteId(job._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-3" />
                                                        Delete Vacancy
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={!!pendingDeleteId}
                onClose={() => setPendingDeleteId(null)}
                onConfirm={async () => {
                    await deleteJob.mutateAsync(pendingDeleteId);
                    setPendingDeleteId(null);
                }}
                title="Delete vacancy?"
                description="This permanently removes the job posting. Applicants will no longer see it."
                confirmLabel="Delete"
                variant="destructive"
                isLoading={deleteJob.isPending}
            />

            {/* Platform Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
                <Link to="/community" className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                        <Globe className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Community Feed</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Engage with verified workers</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>

                <Link to="/messages" className="group bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                        <MessageSquare className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Secure Messaging</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct communication channel</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>

                <div className="bg-slate-900 p-8 rounded-[40px] text-white flex items-center gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-3xl" />
                    <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Bell className="h-7 w-7" />
                    </div>
                    <div className="flex-1 relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-tight">Stay Informed</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time recruitment alerts</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployerDashboard;
