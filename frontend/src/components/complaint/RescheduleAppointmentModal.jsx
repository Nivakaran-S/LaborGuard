import { useEffect, useState } from "react";
import { X, Calendar as CalIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useComplaints } from "@/hooks/useComplaints";
import { toast } from "sonner";

const toLocalInputValue = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const RescheduleAppointmentModal = ({ open, onClose, appointment, onRescheduled }) => {
  const { rescheduleAppointment } = useComplaints();
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open && appointment) {
      setScheduledAt(toLocalInputValue(appointment.scheduledAt));
      setReason("");
    }
  }, [open, appointment]);

  if (!open || !appointment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledAt) {
      toast.error("Pick a new date and time.");
      return;
    }
    const iso = new Date(scheduledAt).toISOString();
    if (new Date(iso).getTime() <= Date.now()) {
      toast.error("New slot must be in the future.");
      return;
    }
    if (!reason.trim()) {
      toast.error("A reason is required for rescheduling.");
      return;
    }
    try {
      await rescheduleAppointment.mutateAsync({
        appointmentId: appointment._id,
        data: { scheduledAt: iso, reason: reason.trim() },
      });
      onRescheduled?.();
      onClose?.();
    } catch {
      /* toast handled in hook */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Reschedule Appointment
            </h3>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              Case #{String(appointment.complaintId || "").slice(-6)} · Apt #{String(appointment._id).slice(-6)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <CalIcon className="h-3.5 w-3.5" />
              New date &amp; time
            </label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={toLocalInputValue(new Date(Date.now() + 15 * 60 * 1000))}
              className="h-11 rounded-xl bg-slate-50 border-none"
            />
            <p className="text-[10px] font-bold text-slate-400">
              Current: {new Date(appointment.scheduledAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 300))}
              placeholder="Why is this slot being moved?"
              className="w-full min-h-[90px] bg-slate-50 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="text-[10px] font-bold text-slate-400 text-right">{reason.length}/300</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-full text-xs font-black text-slate-500 hover:bg-slate-100 uppercase tracking-widest"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={rescheduleAppointment.isPending}
              className="h-10 px-6 rounded-full font-black uppercase tracking-widest text-[11px]"
            >
              {rescheduleAppointment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reschedule"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { RescheduleAppointmentModal };
