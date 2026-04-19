import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { appointmentApi } from "@/api/appointmentApi";
import { useComplaints } from "@/hooks/useComplaints";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  ShieldCheck,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Target,
  CalendarClock,
} from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { RescheduleAppointmentModal } from "@/components/complaint/RescheduleAppointmentModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_LABELS = {
  auto_booked: "Auto-Booked",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS = {
  auto_booked: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
};

const formatCategory = (category) =>
  category ? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "—";

const AdminAppointments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirmingApt, setConfirmingApt] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState("");
  const [confirmNotes, setConfirmNotes] = useState("");
  const [cancelId, setCancelId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [reschedulingApt, setReschedulingApt] = useState(null);

  const { confirmAppointment, cancelAppointment } = useComplaints();

  const { data: rawAppointments = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: async () => {
      const res = await appointmentApi.getAllAppointments();
      return res.data?.data?.appointments || res.data?.data || [];
    },
  });

  const appointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rawAppointments
      .filter((apt) => statusFilter === "all" || apt.status === statusFilter)
      .filter((apt) => {
        if (!term) return true;
        const complaintIdStr = String(apt.complaintId || "").toLowerCase();
        const workerIdStr = String(apt.workerId || "").toLowerCase();
        return complaintIdStr.includes(term) || workerIdStr.includes(term);
      });
  }, [rawAppointments, searchTerm, statusFilter]);

  const openConfirm = (apt) => {
    setConfirmingApt(apt);
    setMeetingDetails("");
    setConfirmNotes("");
  };

  const submitConfirm = async () => {
    if (!confirmingApt) return;
    if (!meetingDetails.trim()) {
      toast.error("Meeting details are required.");
      return;
    }
    await confirmAppointment.mutateAsync({
      appointmentId: confirmingApt._id,
      data: { meetingDetails: meetingDetails.trim(), notes: confirmNotes.trim() || undefined },
    });
    setConfirmingApt(null);
    refetch();
  };

  const submitCancel = async () => {
    if (!cancelId) return;
    await cancelAppointment.mutateAsync({
      appointmentId: cancelId,
      reason: cancelReason.trim() || "Cancelled by admin",
    });
    setCancelId(null);
    setCancelReason("");
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-32 flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
          Loading Appointments...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-20 mt-4 px-2 lg:px-6">
      <header className="space-y-4">
        <Badge
          variant="outline"
          className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[10px] px-6 py-2 rounded-full bg-primary/5"
        >
          Appointment Registry
        </Badge>
        <h1 className="text-4xl font-black tracking-tight text-slate-900 leading-tight">
          Legal Consultation <span className="text-primary italic">Oversight.</span>
        </h1>
        <p className="text-sm font-bold text-slate-400 max-w-xl">
          Confirm auto-booked slots, attach meeting details, or cancel when needed.
        </p>
      </header>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by complaint ID or worker ID..."
            className="pl-11 h-11 rounded-2xl bg-slate-50 border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="h-11 rounded-2xl border-none bg-slate-50 px-4 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* List */}
      {appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments"
          description="No appointments match the current filters."
          className="h-[300px] bg-white border border-slate-100 rounded-3xl"
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => {
            const scheduled = new Date(apt.scheduledAt);
            const isOnline = apt.meetingType === "online";
            const canConfirm = apt.status === "auto_booked";
            const canReschedule = apt.status === "auto_booked" || apt.status === "confirmed";
            const canCancel = apt.status !== "cancelled" && apt.status !== "completed";
            return (
              <div
                key={apt._id}
                className="bg-white rounded-3xl border border-slate-100 p-6 flex flex-col md:flex-row gap-6"
              >
                <div className="bg-slate-900 text-white p-5 rounded-2xl min-w-[120px] text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {scheduled.toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  <p className="text-3xl font-black tracking-tighter">{scheduled.getDate()}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-primary">
                    {scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn("rounded-full px-3 font-black uppercase tracking-widest text-[9px]", STATUS_COLORS[apt.status])}>
                      {STATUS_LABELS[apt.status] || apt.status}
                    </Badge>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                      Case #{String(apt.complaintId || "").slice(-6)} · Apt #{String(apt._id).slice(-6)}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800">
                    {formatCategory(apt.category)}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      Officer #{String(apt.legalOfficerId || "").slice(-6)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      Worker #{String(apt.workerId || "").slice(-6)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      {isOnline ? <Video className="h-3.5 w-3.5 text-primary" /> : <MapPin className="h-3.5 w-3.5 text-primary" />}
                      {apt.meetingDetails || (apt.meetingType || "TBD")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:w-48">
                  {canConfirm && (
                    <Button
                      onClick={() => openConfirm(apt)}
                      className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      Confirm
                    </Button>
                  )}
                  {canReschedule && (
                    <Button
                      onClick={() => setReschedulingApt(apt)}
                      variant="ghost"
                      className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-primary hover:bg-primary/5"
                    >
                      <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                      Reschedule
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      onClick={() => setCancelId(apt._id)}
                      variant="ghost"
                      className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-destructive hover:bg-red-50"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirmingApt && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmingApt(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Confirm Appointment
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mt-1">
                Case #{String(confirmingApt.complaintId || "").slice(-6)}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Meeting details <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder={
                    confirmingApt.meetingType === "online"
                      ? "https://meet.google.com/..."
                      : "Office address or phone number"
                  }
                  value={meetingDetails}
                  onChange={(e) => setMeetingDetails(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Notes (optional)
                </label>
                <textarea
                  value={confirmNotes}
                  onChange={(e) => setConfirmNotes(e.target.value)}
                  className="w-full min-h-[80px] bg-slate-50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Bring ID, documents, etc."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setConfirmingApt(null)}
                className="h-10 px-5 rounded-full text-xs font-black text-slate-500 hover:bg-slate-100 uppercase tracking-widest"
              >
                Cancel
              </button>
              <Button
                onClick={submitConfirm}
                disabled={confirmAppointment.isPending}
                className="h-10 px-6 rounded-full font-black uppercase tracking-widest text-[11px]"
              >
                {confirmAppointment.isPending ? "Confirming..." : "Confirm Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel dialog */}
      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={submitCancel}
        title="Cancel appointment?"
        description="The worker and officer will be notified. This cannot be undone."
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Slot"
        variant="destructive"
        isLoading={cancelAppointment.isPending}
      />

      {/* Reschedule modal */}
      <RescheduleAppointmentModal
        open={!!reschedulingApt}
        appointment={reschedulingApt}
        onClose={() => setReschedulingApt(null)}
        onRescheduled={refetch}
      />
    </div>
  );
};

export default AdminAppointments;
