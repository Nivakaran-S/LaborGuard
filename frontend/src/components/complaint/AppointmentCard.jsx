import { format } from "date-fns";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../common/Button";
import { Badge } from "../common/Badge";

const AppointmentCard = ({ appointment, onCancel, onJoin }) => {
  const {
    _id,
    scheduledAt,
    status,
    meetingType,
    meetingDetails,
    notes,
    legalOfficerId, // ObjectId string (unpopulated) or populated object
  } = appointment;

  const isOnline = meetingType === "online";
  const officer =
    typeof legalOfficerId === "object" && legalOfficerId !== null ? legalOfficerId : null;
  const officerName = officer?.name || officer?.firstName || null;
  const officerIdStr = typeof legalOfficerId === "string" ? legalOfficerId : officer?._id;

  const getStatusConfig = (status) => {
    switch (status) {
      case "auto_booked":
        return { 
          label: "Auto Booked", 
          variant: "secondary", 
          class: "bg-amber-100 text-amber-700 border-amber-200",
          icon: AlertCircle,
          desc: "Pending confirmation from legal officer"
        };
      case "confirmed":
        return { 
          label: "Confirmed", 
          variant: "default", 
          class: "bg-green-100 text-green-700 border-green-200",
          icon: CheckCircle2,
          desc: "Your consultation is ready"
        };
      case "cancelled":
        return { 
          label: "Cancelled", 
          variant: "destructive", 
          class: "bg-red-100 text-red-700 border-red-200",
          icon: XCircle,
          desc: "This appointment was cancelled"
        };
      default:
        return { label: status, variant: "outline", class: "", icon: Calendar, desc: "" };
    }
  };

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;
  const isPast = new Date(scheduledAt) < new Date();

  return (
    <div className={cn(
      "group bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5",
      status === "cancelled" && "opacity-60",
      isPast && status !== "cancelled" && "bg-slate-50/50"
    )}>
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("rounded-full px-3 font-black uppercase tracking-widest text-[9px] border", statusConfig.class)}>
                {statusConfig.label}
            </Badge>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: #{_id?.slice(-6)}</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-800">
                {format(new Date(scheduledAt), "EEEE, MMMM do")}
            </h3>
            <div className="flex items-center gap-4 text-sm font-bold text-slate-500">
                <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {format(new Date(scheduledAt), "p")}
                </span>
                <span className="flex items-center gap-1.5">
                    {isOnline ? <Video className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                    {isOnline ? "Video Consultation" : meetingType === "phone" ? "Phone Call" : "In-Person Meeting"}
                </span>
            </div>
          </div>

          {officerIdStr && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs">
                    {officerName?.charAt(0) || "L"}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Officer</p>
                    <p className="text-xs font-bold text-slate-700">
                      {officerName || `Officer #${officerIdStr.slice(-6)}`}
                    </p>
                </div>
            </div>
          )}

          {meetingDetails && (
            <p className="text-xs font-bold text-slate-600 bg-primary/5 p-3 rounded-xl border border-primary/10 leading-relaxed break-all">
                <span className="block text-[10px] font-black uppercase tracking-widest text-primary mb-1">Meeting Details</span>
                {meetingDetails}
            </p>
          )}

          {notes && (
            <p className="text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 italic leading-relaxed">
                "{notes}"
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between items-end gap-4 min-w-[200px]">
            <div className="text-right hidden md:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status Note</p>
                <p className="text-xs font-bold text-slate-600 leading-tight">{statusConfig.desc}</p>
            </div>

            <div className="flex flex-col gap-2 w-full">
                {status === "confirmed" && isOnline && meetingDetails && (
                    <Button
                        onClick={() => {
                            const url = /^https?:\/\//.test(meetingDetails)
                                ? meetingDetails
                                : `https://${meetingDetails}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                        }}
                        className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/10"
                    >
                        <Video className="h-3.5 w-3.5 mr-2" />
                        Join Meeting
                    </Button>
                )}
                {status !== "cancelled" && !isPast && (
                    <Button 
                        variant="ghost" 
                        onClick={() => onCancel?.(_id)}
                        className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] h-10 text-destructive hover:bg-red-50"
                    >
                        Cancel Appointment
                    </Button>
                )}
                {isPast && status === "confirmed" && (
                    <Badge variant="outline" className="w-full justify-center py-2 rounded-xl text-slate-400 font-black uppercase tracking-widest text-[10px] bg-slate-100/50">
                        Completed
                    </Badge>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}

export { AppointmentCard }
