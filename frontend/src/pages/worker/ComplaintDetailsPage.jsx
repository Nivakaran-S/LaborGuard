import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useComplaints } from "@/hooks/useComplaints";
import { 
  FileText, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  ChevronLeft,
  Paperclip,
  User as UserIcon,
  MessageSquare,
  Building2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Loader2,
  Calendar
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const ComplaintDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { useGetComplaint, updateStatus } = useComplaints();
    const { data: complaint, isLoading, error } = useGetComplaint(id);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending': return { 
                label: 'Awaiting Review', 
                class: 'bg-amber-100 text-amber-700 border-amber-200', 
                icon: Clock,
                desc: "Your case has been filed and is waiting for an administrator to assign a legal officer."
            };
            case 'under_review': return { 
                label: 'Under Investigation', 
                class: 'bg-blue-100 text-blue-700 border-blue-200', 
                icon: ShieldAlert,
                desc: "A legal officer is currently reviewing your evidence and contacting the involved parties."
            };
            case 'resolved': return { 
                label: 'Case Resolved', 
                class: 'bg-green-100 text-green-700 border-green-200', 
                icon: CheckCircle2,
                desc: "This dispute has been successfully closed. See the resolution report below."
            };
            case 'rejected': return { 
                label: 'Dispute Rejected', 
                class: 'bg-red-100 text-red-700 border-red-200', 
                icon: AlertCircle,
                desc: "Your case was not accepted. Please review the officer's feedback for details."
            };
            default: return { label: status, class: '', icon: AlertCircle, desc: '' };
        }
    };

    if (isLoading) return (
        <div className="p-32 flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Decoding Evidence Locker...</p>
        </div>
    );

    if (error || !complaint) return (
        <div className="p-20 text-center space-y-6">
            <div className="h-24 w-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="h-12 w-12" />
            </div>
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Case Unauthorized or Not Found</h2>
                <p className="text-sm font-bold text-slate-500 uppercase italic max-w-md mx-auto leading-relaxed">The requested case details are either restricted or do not exist in our secure vault.</p>
            </div>
            <Button onClick={() => navigate(-1)} variant="outline" className="rounded-full px-10 h-14 font-black uppercase tracking-widest text-xs">
                Return to Safety
            </Button>
        </div>
    );

    const statusConfig = getStatusConfig(complaint.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Header Navigation */}
            <div className="flex justify-between items-center px-2">
                <Button variant="ghost" onClick={() => navigate(-1)} className="rounded-full font-black uppercase tracking-widest text-[9px] text-slate-400 hover:text-primary transition-all">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Case Files
                </Button>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Case Protocol:</span>
                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] tracking-widest uppercase py-1">SECURE-v1.4</Badge>
                </div>
            </div>

            {/* Immersive Case Header */}
            <div className="bg-white p-10 md:p-14 rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-1/4 h-full bg-primary/5 blur-[80px]" />
                 <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-12">
                    <div className="space-y-8 flex-1">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Badge className={cn("px-4 py-1.5 rounded-full border font-black uppercase tracking-[0.15em] text-[10px]", statusConfig.class)}>
                                    <StatusIcon className="h-3.5 w-3.5 mr-2" />
                                    {statusConfig.label}
                                </Badge>
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Case ID: <span className="text-slate-800">#{complaint._id.slice(-8)}</span></span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                                {complaint.title}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Filed {new Date(complaint.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    {complaint.location?.city && complaint.location?.district 
                                        ? `${complaint.location.city}, ${complaint.location.district}` 
                                        : 'Location not specified'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-[32px] text-white w-fit max-w-md shadow-2xl">
                             <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <Building2 className="h-5 w-5" />
                             </div>
                             <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Reported Employer</p>
                                 <p className="text-sm font-black tracking-tight uppercase">{complaint.organizationName || "Confidential Organization"}</p>
                             </div>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
                         <div className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] space-y-2">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Priority</p>
                             <div className="flex items-center gap-2">
                                <div className={cn("h-3 w-3 rounded-full shadow-glow", complaint.priority === 'critical' ? 'bg-red-500' : 'bg-primary')} />
                                <span className="text-sm font-black uppercase tracking-widest text-slate-800">{complaint.priority}</span>
                             </div>
                         </div>
                         <Button asChild className="w-full h-16 rounded-[32px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 group">
                             <Link to={`/messages?case=${complaint._id}`}>
                                 <MessageSquare className="h-4 w-4 mr-2" />
                                 Contact Assigned Officer
                                 <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                             </Link>
                         </Button>
                    </div>
                 </div>
            </div>

            {/* Content Breakdown */}
            <div className="grid lg:grid-cols-3 gap-10 px-2 lg:px-6">
                <div className="lg:col-span-2 space-y-10">
                    {/* Lawyer Control Panel */}
                    {user?.role === 'lawyer' && (
                        <div className="bg-primary/5 border-2 border-primary/20 p-8 rounded-[48px] space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <ShieldAlert className="h-5 w-5 text-primary" />
                                        Resolution Protocol
                                    </h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update case life-cycle status</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <select 
                                        className="h-14 px-6 rounded-2xl bg-white border-2 border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                                        value={complaint.status}
                                        onChange={(e) => {
                                            const reason = window.prompt("Actionable Reason for Status Change:");
                                            if (reason) {
                                                updateStatus.mutate({ complaintId: id, status: e.target.value, reason });
                                            }
                                        }}
                                    >
                                        <option value="pending">Mark as Pending</option>
                                        <option value="under_review">Start Investigation</option>
                                        <option value="resolved">Close as Resolved</option>
                                        <option value="rejected">Mark as Rejected</option>
                                    </select>
                                    <Button variant="ghost" className="h-14 w-14 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-primary transition-all">
                                        <Loader2 className={cn("h-5 w-5", updateStatus.isPending && "animate-spin")} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detailed Narrative */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Case Narrative</h2>
                        </div>
                        <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm leading-relaxed text-slate-600 font-medium">
                            <p className="whitespace-pre-wrap">{complaint.description}</p>
                        </div>
                    </div>

                    {/* Evidence Locker */}
                    {complaint.attachments && complaint.attachments.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Paperclip className="h-5 w-5 text-primary" />
                                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Evidence Locker</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {complaint.attachments.map((file, i) => (
                                    <a 
                                        key={i} 
                                        href={file.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="group p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-2xl hover:border-primary/20 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                                                <Paperclip className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 line-clamp-1">{file.originalName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{file.fileType}</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Tracking & Support */}
                <div className="space-y-8">
                    {/* Resolution Progress */}
                    <div className="bg-slate-900 p-10 rounded-[48px] text-white space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-3xl" />
                        <div className="space-y-2">
                             <h3 className="text-lg font-black uppercase tracking-tight">Status Timeline</h3>
                             <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Encryption Status: Verified</p>
                        </div>

                        <div className="space-y-12 relative">
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-800" />
                            
                            {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
                                complaint.statusHistory.map((h, i) => (
                                    <div key={i} className="flex gap-6 relative z-10">
                                        <div className="h-10 w-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center shrink-0">
                                            <div className="h-3 w-3 rounded-full bg-primary shadow-glow" />
                                        </div>
                                        <div className="space-y-1 pt-1">
                                            <p className="text-xs font-black uppercase tracking-widest text-white">{h.status.replace('_', ' ')}</p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight italic">"{h.reason || 'System update'}"</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">{new Date(h.changedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex gap-6 relative z-10">
                                    <div className="h-10 w-10 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center shrink-0">
                                        <div className="h-3 w-3 rounded-full bg-primary shadow-glow" />
                                    </div>
                                    <div className="space-y-1 pt-1 flex-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-white">Files Initialized</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight italic">Tracking active via Secure Protocol</p>
                                        <div className="mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                             <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">{statusConfig.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Officer Card */}
                    <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Assigned Officer</h3>
                        </div>
                        
                        {complaint.assignedTo ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[32px]">
                                    <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-primary font-black uppercase text-xs">
                                        {complaint.assignedTo.name?.charAt(0) || "LO"}
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-800">{complaint.assignedTo.name || "Assigned Legal Officer"}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Licensed Professional</p>
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center leading-relaxed italic px-4">
                                    All communication within this portal is monitored for compliance with labor law standards.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="h-16 w-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
                                    <Clock className="h-8 w-8 animate-pulse" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Assignment Pending</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-6 italic">Next available officer will be assigned based on severity.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetailsPage;
