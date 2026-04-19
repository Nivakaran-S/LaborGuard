import { useState } from "react";
import { useComplaints } from "@/hooks/useComplaints";
import { AppointmentCard } from "@/components/complaint/AppointmentCard";
import { Calendar, Info } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { Spinner } from "@/components/common/Spinner";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";

const FILTER_TABS = [
  { value: "",            label: "All Slots" },
  { value: "auto_booked", label: "Pending" },
  { value: "confirmed",   label: "Confirmed" },
  { value: "completed",   label: "Completed" },
  { value: "cancelled",   label: "Cancelled" },
];

const MyAppointments = () => {
  const [params, setParams] = useState({ status: "" });
  const [cancelId, setCancelId] = useState(null);

  const { useGetMyAppointments, cancelAppointment } = useComplaints();

  // FIX: Default to [] — prevents crash when API returns undefined during loading
  const { data: appointments = [], isLoading } = useGetMyAppointments(params);

  const handleCancel = async () => {
    if (!cancelId) return;
    await cancelAppointment.mutateAsync({
      appointmentId: cancelId,
      reason: "Cancelled by worker",
    });
    setCancelId(null);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Badge
            variant="outline"
            className="text-primary border-primary/20 font-black uppercase tracking-widest text-[9px]">
            Legal Support
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">My Appointments</h1>
          <p className="text-sm font-bold text-slate-500 max-w-lg">
            Manage your scheduled consultations with legal professionals.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-3xl flex gap-4 items-start">
        <div className="bg-white p-2 rounded-xl shadow-sm shrink-0">
          <Info className="h-5 w-5 text-blue-500" />
        </div>
        <p className="text-xs font-bold text-blue-700 leading-relaxed uppercase italic">
          Appointments are automatically booked when you file a high-priority complaint.
          Legal officers will confirm the final time slot soon.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2 p-1 bg-slate-100 w-fit rounded-2xl flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setParams({ ...params, status: tab.value })}
            className={cn(
              "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              params.status === tab.value
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Spinner size="lg" />
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">
              Syncing Calendar...
            </p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt._id}
                appointment={appt}
                onCancel={(id) => setCancelId(id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Calendar}
            title="No appointments found"
            description={
              params.status
                ? `You don't have any ${params.status.replace("_", " ")} appointments.`
                : "Your legal calendar is currently empty. High-priority cases will auto-book time slots here."
            }
            className="h-[400px]"
          />
        )}
      </div>

      {/* Cancel Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Cancel Appointment?"
        description="Are you sure you want to cancel this legal consultation? You can only reschedule through the admin."
        confirmLabel="Yes, Cancel Slot"
        cancelLabel="Keep Slot"
        isLoading={cancelAppointment.isPending}
      />
    </div>
  );
};

export default MyAppointments;