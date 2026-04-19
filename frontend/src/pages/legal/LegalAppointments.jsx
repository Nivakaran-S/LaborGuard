import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { appointmentApi } from "@/api/appointmentApi";
import { toast } from "sonner";
import {
  Calendar,
  CalendarClock,
  Clock,
  MapPin,
  User as UserIcon,
  Video,
  MessageSquare,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  LayoutGrid,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Target
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { RescheduleAppointmentModal } from "@/components/complaint/RescheduleAppointmentModal";
import { cn } from "@/lib/utils";

const LegalAppointments = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [reschedulingApt, setReschedulingApt] = useState(null);

    const { data: rawAppointments = [], isLoading, refetch } = useQuery({
        queryKey: ['legal-appointments', user?.userId],
        queryFn: async () => {
            const res = await appointmentApi.getAssignedAppointments();
            return res.data?.data?.appointments || res.data?.appointments || res.data?.data || [];
        },
        enabled: !!user?.userId,
    });

    const appointments = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return rawAppointments
            .filter((apt) => statusFilter === "all" || apt.status === statusFilter)
            .filter((apt) => {
                if (!term) return true;
                const worker = apt.worker || {};
                const name = (
                    worker.firstName
                        ? `${worker.firstName} ${worker.lastName || ""}`
                        : String(apt.workerId || "")
                ).toLowerCase();
                const complaintIdStr = String(apt.complaintId || "").toLowerCase();
                return name.includes(term) || complaintIdStr.includes(term);
            });
    }, [rawAppointments, searchTerm, statusFilter]);

    const handleCalendarSync = () => {
        toast.info("Google Calendar sync will be available soon.");
    };

    const handleLaunchLink = (apt) => {
        if (apt.meetingType === "online" && apt.meetingDetails) {
            const url = /^https?:\/\//.test(apt.meetingDetails)
                ? apt.meetingDetails
                : `https://${apt.meetingDetails}`;
            window.open(url, "_blank", "noopener,noreferrer");
        } else if (apt.complaintId) {
            navigate(`/legal/cases/${apt.complaintId}`);
        } else {
            toast.info("Meeting details not yet published.");
        }
    };

    const STATUS_LABELS = {
        auto_booked: "Auto-Booked",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled",
    };

    const formatCategory = (category) =>
        category ? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Legal Consultation";

    const getWorkerName = (apt) => {
        if (apt.worker?.firstName) return `${apt.worker.firstName} ${apt.worker.lastName || ""}`.trim();
        if (apt.workerId) return `Worker #${String(apt.workerId).slice(-6)}`;
        return "Unknown Worker";
    };

    if (isLoading) return (
        <div className="p-32 flex flex-col items-center">
            <Spinner size="lg" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono italic">SYNCING CALENDAR PROTOCOLS...</p>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade-in pb-20 mt-4 px-2 lg:px-6">
            {/* Header: Global Calendar */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div className="space-y-4">
                    <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full bg-primary/5">Legal Master Calendar</Badge>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                        Consultation <br />
                        <span className="text-primary italic">Schedule.</span>
                    </h1>
                    <p className="text-sm font-bold text-slate-400 max-w-xl leading-relaxed uppercase italic">
                        Managing justice face-to-face. <span className="text-slate-800 not-italic font-black">Coordinating legal interventions for verified workers.</span>
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <Button
                        onClick={handleCalendarSync}
                        variant="outline"
                        className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-[10px] border-2 border-slate-100 bg-white hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Calendar className="h-4 w-4 mr-2" />
                        Sync Google Calendar
                    </Button>
                </div>
            </header>

            {/* Registry Control Bar */}
            <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Search applicant or Case ID..." 
                        className="pl-14 h-14 rounded-[28px] bg-slate-50/50 border-none shadow-inner focus:bg-white text-sm font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-3 w-full lg:w-auto relative">
                    <Button
                        onClick={() => setShowFilterMenu((s) => !s)}
                        variant="ghost"
                        className={cn(
                            "h-14 w-14 rounded-[28px] bg-slate-50/50 hover:bg-primary/5 text-slate-400 hover:text-primary transition-all",
                            statusFilter !== "all" && "bg-primary/10 text-primary"
                        )}
                    >
                        <Filter className="h-5 w-5" />
                    </Button>
                    {showFilterMenu && (
                        <div className="absolute right-0 top-16 z-20 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-1">
                            {["all", "auto_booked", "confirmed", "completed", "cancelled"].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => { setStatusFilter(s); setShowFilterMenu(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50",
                                        statusFilter === s ? "text-primary bg-primary/5" : "text-slate-500"
                                    )}
                                >
                                    {s === "all" ? "All Appointments" : STATUS_LABELS[s] || s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Appointment Grid */}
            <div className="space-y-8">
                {appointments.length === 0 ? (
                    <EmptyState
                        icon={Calendar}
                        title="Your schedule is clear"
                        description="No appointments scheduled for the current period."
                        className="h-[400px] bg-white border border-slate-100 rounded-[56px]"
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {appointments.map((apt) => (
                            <div key={apt._id} className="group bg-white p-2 rounded-[48px] border border-slate-100 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/40">
                                <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-10 flex-1">
                                        {/* Date/Time Block */}
                                        <div className="space-y-1 bg-slate-900 text-white p-6 rounded-[32px] min-w-[140px] text-center shadow-xl shadow-slate-900/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{new Date(apt.scheduledAt).toLocaleDateString('en-US', { month: 'short' })}</p>
                                            <p className="text-4xl font-black tracking-tighter">{new Date(apt.scheduledAt).getDate()}</p>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-primary">{new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>

                                        <div className="space-y-4 flex-1">
                                            <div className="flex items-center gap-3">
                                                <Badge className={cn(
                                                    "px-3 py-1 rounded-full font-black uppercase tracking-widest text-[8px]",
                                                    apt.status === 'confirmed' ? "bg-green-100 text-green-700" :
                                                    apt.status === 'cancelled' ? "bg-red-100 text-red-700" :
                                                    apt.status === 'completed' ? "bg-slate-100 text-slate-700" :
                                                    "bg-amber-100 text-amber-700"
                                                )}>
                                                    {STATUS_LABELS[apt.status] || apt.status}
                                                </Badge>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono">Case #{String(apt.complaintId || '').slice(-6)}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                                {getWorkerName(apt)}
                                                <ShieldCheck className="h-5 w-5 text-blue-500" />
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl">
                                                    <Target className="h-4 w-4 text-primary" />
                                                    {formatCategory(apt.category)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {apt.meetingType === 'online' ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                                                    {apt.meetingDetails || (apt.meetingType ? apt.meetingType.replace('_',' ') : 'TBD')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <Button
                                            onClick={() => handleLaunchLink(apt)}
                                            className="h-16 px-10 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 group flex items-center"
                                        >
                                            {apt.meetingType === 'online' ? <Video className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
                                            {apt.meetingType === 'online' ? "Launch Secure Link" : "View Case"}
                                        </Button>
                                        {(apt.status === 'auto_booked' || apt.status === 'confirmed') && (
                                            <Button
                                                onClick={() => setReschedulingApt(apt)}
                                                variant="ghost"
                                                className="h-16 px-6 rounded-full font-black uppercase tracking-widest text-[10px] bg-slate-50 hover:bg-primary/5 text-primary transition-all"
                                                title="Reschedule"
                                            >
                                                <CalendarClock className="h-4 w-4 mr-2" />
                                                Reschedule
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => apt.complaintId && navigate(`/legal/cases/${apt.complaintId}`)}
                                            variant="ghost"
                                            size="icon"
                                            className="h-16 w-16 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                                            title="Open case"
                                        >
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Background Texture Accents */}
            <div className="fixed bottom-0 right-0 p-12 opacity-[0.03] pointer-events-none select-none">
                 <Calendar className="h-96 w-96 rotate-12" />
            </div>

            <RescheduleAppointmentModal
                open={!!reschedulingApt}
                appointment={reschedulingApt}
                onClose={() => setReschedulingApt(null)}
                onRescheduled={refetch}
            />
        </div>
    );
};

export default LegalAppointments;
