import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  FileText, 
  Calendar, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../common/Badge";

const ComplaintCard = ({ complaint, className }) => {
  const {
    _id,
    title,
    category,
    priority,
    status,
    createdAt,
    organizationName,
  } = complaint;

  const getStatusConfig = (status) => {
    switch (status) {
      case "pending":
        return { 
            icon: Clock, 
            label: "Pending", 
            variant: "secondary", 
            class: "bg-amber-100 text-amber-700 border-amber-200" 
        }
      case "under_review":
        return { 
            icon: AlertCircle, 
            label: "Under Review", 
            variant: "default", 
            class: "bg-blue-100 text-blue-700 border-blue-200" 
        }
      case "resolved":
        return { 
            icon: CheckCircle2, 
            label: "Resolved", 
            variant: "default", 
            class: "bg-green-100 text-green-700 border-green-200" 
        }
      case "rejected":
        return { 
            icon: XCircle, 
            label: "Rejected", 
            variant: "destructive", 
            class: "bg-red-100 text-red-700 border-red-200" 
        }
      default:
        return { icon: HelpCircle, label: status, variant: "outline", class: "" }
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-50 border-red-100";
      case "high": return "text-orange-600 bg-orange-50 border-orange-100";
      case "medium": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-slate-600 bg-slate-50 border-slate-100";
    }
  }

  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <Link 
      to={`/worker/complaints/${_id}`}
      className={cn(
        "group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white border border-slate-100 rounded-3xl transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-start gap-4 min-w-0">
        <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary/10",
            statusConfig.class
        )}>
          <StatusIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{_id?.slice(-6)}</span>
            <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border",
                getPriorityColor(priority)
            )}>
                {priority} Priority
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-800 truncate pr-4">{title}</h3>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5 capitaize">
                <FileText className="h-3.5 w-3.5" />
                {category.replace('_', ' ')}
            </span>
            <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 flex items-center gap-3 w-full sm:w-auto">
        <div className={cn(
            "px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all group-hover:scale-105",
            statusConfig.class
        )}>
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", statusConfig.class.split(' ')[1])} />
            {statusConfig.label}
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all ml-auto">
            <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </Link>
  )
}

export { ComplaintCard }
