import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useJobs } from "@/hooks/useJobs";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  PlusCircle,
  TrendingDown,
  LayoutGrid,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { JobCard } from "@/components/job/JobCard";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/Dialog"; // Using UI dialog for now as it's standard
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const JobBoardPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { useGetJobs, useGetMyApplications, applyForJob } = useJobs();
    
    const [params, setParams] = useState({
        search: "",
        jobType: "",
        city: "",
    });
    
    const [selectedJob, setSelectedJob] = useState(null);
    const [applyData, setApplyData] = useState({ workerExperience: "", details: "" });

    const { data: jobs, isLoading: jobsLoading } = useGetJobs(params);
    const { data: myApplications } = useGetMyApplications();

    const handleOpenApply = (job) => {
        if (!isAuthenticated) {
            toast.error("Please login to apply for jobs");
            navigate("/login");
            return;
        }
        
        if (user?.role !== 'worker') {
            toast.error("Action Denied", {
                description: "You must be a verified worker to apply to this formal position."
            });
            return;
        }

        setSelectedJob(job);
    };

    const handleApply = async () => {
        if (!selectedJob) return;
        try {
            await applyForJob.mutateAsync({ 
                jobId: selectedJob._id, 
                data: applyData 
            });
            setSelectedJob(null);
            setApplyData({ workerExperience: "", details: "" });
        } catch (error) {
            // Handled in hook
        }
    };

    const hasApplied = (jobId) => myApplications?.some(app => app.jobId?._id === jobId);

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Immersive Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-4">
                <div className="space-y-2">
                    <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] px-3 py-1">Verified Opportunities</Badge>
                    <h1 className="text-5xl font-black tracking-tight text-slate-800">Job Board.</h1>
                    <p className="text-sm font-bold text-slate-400 max-w-lg leading-relaxed uppercase italic">Every listing here is verified by LaborGuard to ensure fair wages and safe working environments.</p>
                </div>
            </div>

            {/* Premium Filter Bar */}
            <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search positions, keywords, or cities..." 
                        className="pl-14 h-14 rounded-2xl bg-slate-50/50 border-none shadow-inner focus:bg-white text-sm font-bold"
                        onChange={(e) => setParams({ ...params, search: e.target.value })}
                    />
                </div>
                
                <div className="flex gap-3 w-full lg:w-auto">
                    <select 
                        className="flex-1 lg:w-52 h-14 rounded-2xl border-none bg-slate-50/50 px-6 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none transition-all"
                        onChange={(e) => setParams({ ...params, jobType: e.target.value })}
                    >
                        <option value="">All Job Types</option>
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="daily_wage">Daily Wage</option>
                    </select>

                    <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-slate-50/50 hover:bg-primary/5 text-slate-400 hover:text-primary transition-all">
                        <Filter className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Grid of Results */}
            <div className="min-h-[400px]">
                {jobsLoading ? (
                    <div className="p-32 flex flex-col items-center">
                        <Spinner size="lg" />
                        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Board...</p>
                    </div>
                ) : jobs?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                        {jobs.map((job) => (
                            <JobCard 
                                key={job._id} 
                                job={job} 
                                hasApplied={hasApplied(job._id)} 
                                onApply={handleOpenApply}
                                onDetail={handleOpenApply}
                                currentUserId={user?.id}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon={Briefcase}
                        title="No vacancies found"
                        description="Try adjusting your filters or area to find matching labor opportunities."
                        className="h-[400px] bg-slate-50 border-none rounded-[56px]"
                    />
                )}
            </div>

            {/* Application Multi-Modal */}
            <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
                <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-[48px] border-none shadow-3xl">
                    <div className="bg-slate-900 px-10 py-10 text-white space-y-4">
                        <Badge className="bg-primary/20 text-primary border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px]">Priority Application</Badge>
                        <DialogHeader>
                            <DialogTitle className="text-4xl font-black tracking-tight leading-tight">
                                Apply for <br />
                                <span className="text-primary italic tracking-tight">{selectedJob?.title}</span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold text-sm uppercase italic pt-2">
                                Your verified profile will be shared with the employer.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-10 space-y-8 bg-white">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 ml-1">
                                <TrendingDown className="h-4 w-4 text-primary" />
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">How would you describe your experience?</Label>
                            </div>
                            <Textarea 
                                placeholder="Describe your past work in this field..." 
                                className="min-h-[160px] rounded-[32px] border-none bg-slate-50 p-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 shadow-inner transition-all placeholder:text-slate-300"
                                value={applyData.workerExperience}
                                onChange={(e) => setApplyData({ ...applyData, workerExperience: e.target.value })}
                            />
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex gap-4 items-start">
                            <div className="bg-white p-2 rounded-xl shadow-sm text-primary">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase italic leading-relaxed">
                                Our community trust engine prioritizes applicants with verified labor identities and positive ratings.
                            </p>
                        </div>

                        <DialogFooter className="gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setSelectedJob(null)} className="h-14 px-10 rounded-full font-black uppercase tracking-widest text-[9px] hover:bg-slate-50">
                                Close Window
                            </Button>
                            <Button 
                                className="flex-1 h-14 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30"
                                onClick={handleApply}
                                disabled={applyForJob.isPending}
                            >
                                {applyForJob.isPending ? "Syncing..." : "🔥 Send Application Now"}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default JobBoardPage;
