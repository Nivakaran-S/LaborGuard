import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Zap,
  ArrowRight,
  Edit
} from "lucide-react";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

const JobCard = ({ job, hasApplied, onApply, onDetail, currentUserId }) => {
  const isOwner = currentUserId && job.employerId === currentUserId;
  const {
    _id,
    title,
    description,
    jobType,
    wage,
    location,
    imageUrl,
    organizationName,
    createdAt
  } = job;

  return (
    <div className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col h-full hover:-translate-y-2">
      {/* Visual Header */}
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
            src={imageUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop'} 
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
            alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
            <Badge className="bg-primary/90 text-white border-none font-black uppercase tracking-widest text-[9px] px-3">
                {jobType.replace('_', ' ')}
            </Badge>
        </div>
        <div className="absolute bottom-4 left-6 right-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Hiring Now</p>
            <h3 className="text-xl font-black text-white leading-tight line-clamp-2 tracking-tight">
                {title}
            </h3>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 flex-1 flex flex-col space-y-6">
        <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex-1 min-w-[120px]">
                <div className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                    <DollarSign className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-black text-slate-700 uppercase">{wage.amount} {wage.currency} / {wage.frequency}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex-1 min-w-[120px]">
                <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                    <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-black text-slate-700 uppercase">{location.city}</span>
            </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-2.5 w-2.5 text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employer: {organizationName || "Verified Partner"}</p>
            </div>
            <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-3 italic">
                "{description}"
            </p>
        </div>

        <div className="pt-4 mt-auto space-y-3">
            {hasApplied ? (
                <div className="w-full py-4 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-700">Application Submitted</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => onDetail?.(_id)}
                        className="rounded-2xl h-14 font-black uppercase tracking-widest text-[9px] text-slate-400 hover:text-slate-800"
                    >
                        View Details
                    </Button>
                    {isOwner ? (
                        <Button 
                            variant="outline"
                            className="rounded-2xl h-14 font-black uppercase tracking-widest text-[9px] border-2 border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => window.location.href = `/employer/jobs/${_id}/edit`}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit My Job
                        </Button>
                    ) : (
                        <Button 
                            onClick={() => onApply?.(job)}
                            className="rounded-2xl h-14 font-black uppercase tracking-widest text-[9px] shadow-xl shadow-primary/20 group"
                        >
                            Apply Fast
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    )}
                </div>
            )}
            <div className="flex justify-center">
                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Posted {new Date(createdAt).toLocaleDateString()}
                 </p>
            </div>
        </div>
      </div>
    </div>
  )
}

export { JobCard }
