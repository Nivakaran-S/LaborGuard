import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useComplaints } from "@/hooks/useComplaints";
import { 
  FileText, 
  MapPin, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  ShieldAlert,
  Upload,
  Info,
  Calendar,
  Building2,
  Zap
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { FileUpload } from "@/components/common/FileUpload";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const complaintSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  category: z.enum(["wage_theft", "unsafe_conditions", "wrongful_termination", "harassment", "discrimination", "unpaid_overtime", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  organizationName: z.string().min(2, "Company/Employer name is required"),
  description: z.string().min(30, "Description must be at least 30 characters"),
});

const NewComplaintPage = () => {
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();
  const { createComplaint } = useComplaints();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      category: "wage_theft",
      priority: "medium",
    }
  });

  const priority = watch("priority");
  const category = watch("category");

  const nextStep = async () => {
    let fields = [];
    if (step === 1) fields = ["title", "category", "priority"];
    if (step === 2) fields = ["organizationName", "description"];

    const isValid = await trigger(fields);
    if (isValid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, data[key]));
      files.forEach(file => formData.append("evidence", file));

      const res = await createComplaint.mutateAsync(formData);
      if (res) navigate("/worker/complaints");
    } catch (error) {
      // Error handled in hook
    }
  };

  const steps = [
    { title: "Core Info", icon: FileText },
    { title: "Details", icon: Info },
    { title: "Evidence", icon: Upload },
    { title: "Review", icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Badge variant="outline" className="text-primary border-primary/20 font-black uppercase tracking-widest text-[9px]">Rights Protection</Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">File a Complaint</h1>
          <p className="text-sm font-bold text-slate-500 max-w-lg">Submit your case details securely. Our legal team will review it within 24 hours.</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-12">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2" />
        <div className="relative flex justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = step > i + 1;
            const isActive = step === i + 1;
            return (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className={cn(
                  "relative z-10 h-12 w-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-300",
                  isCompleted ? "bg-primary border-primary text-white shadow-xl shadow-primary/20" :
                  isActive ? "bg-white border-primary text-primary ring-8 ring-primary/5 shadow-sm" :
                  "bg-white border-slate-100 text-slate-300"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive || isCompleted ? "text-primary" : "text-slate-400")}>{s.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/50">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Complaint Title</label>
                  <Input placeholder="e.g. Unpaid wages for March 2026" className="h-14 rounded-2xl bg-slate-50/50" {...register("title")} />
                  {errors.title && <p className="text-[10px] font-bold text-destructive uppercase ml-1">{errors.title.message}</p>}
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Case Category</label>
                    <select 
                        className="w-full h-14 rounded-2xl border-none bg-slate-50/50 px-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none transition-all"
                        {...register("category")}
                    >
                        <option value="wage_theft">Wage Theft</option>
                        <option value="unsafe_conditions">Unsafe Conditions</option>
                        <option value="wrongful_termination">Wrongful Termination</option>
                        <option value="harassment">Harassment</option>
                        <option value="unpaid_overtime">Unpaid Overtime</option>
                        <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Urgency Level</label>
                    <div className="flex gap-2">
                        {["low", "medium", "high", "critical"].map((p) => (
                            <label key={p} className={cn(
                                "flex-1 py-3 border-2 rounded-2xl text-center cursor-pointer transition-all",
                                priority === p 
                                    ? p === "critical" ? "bg-red-50 border-red-500 text-red-600 shadow-lg shadow-red-100" : "bg-primary/5 border-primary text-primary shadow-lg shadow-primary/5"
                                    : "bg-slate-50/50 border-slate-100 text-slate-400 hover:border-slate-200"
                            )}>
                                <input type="radio" value={p} className="hidden" {...register("priority")} />
                                <span className="text-[10px] font-black uppercase tracking-wider">{p}</span>
                            </label>
                        ))}
                    </div>
                  </div>
               </div>
               
               {priority === "critical" && (
                 <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start animate-bounce-subtle">
                   <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />
                   <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed italic">
                     Critical cases are automatically prioritised. A legal officer will be assigned and a consultation will be auto-booked for the next available slot.
                   </p>
                 </div>
               )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Company / Organization Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Enter employer or company name" className="pl-14 h-14 rounded-2xl bg-slate-50/50" {...register("organizationName")} />
                  </div>
                  {errors.organizationName && <p className="text-[10px] font-bold text-destructive uppercase ml-1">{errors.organizationName.message}</p>}
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Detailed Description</label>
                  <textarea 
                    className="w-full min-h-[200px] rounded-[32px] border-none bg-slate-50/50 p-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 shadow-inner transition-all placeholder:text-slate-400"
                    placeholder="Provide as much detail as possible about the incident, including dates, locations, and involved parties..."
                    {...register("description")}
                  />
                  {errors.description && <p className="text-[10px] font-bold text-destructive uppercase ml-1">{errors.description.message}</p>}
               </div>
            </div>
          )}

          {step === 3 && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-[32px] flex gap-4 items-center">
                   <div className="bg-white p-2.5 rounded-2xl shadow-sm text-amber-500">
                      <Zap className="h-5 w-5" />
                   </div>
                   <div>
                       <p className="text-xs font-black uppercase tracking-tighter text-amber-800">Support your claim</p>
                       <p className="text-[10px] font-bold text-amber-600 uppercase italic">Photos of workplaces, payslips, or recorded voice notes strengthen your case significantly.</p>
                   </div>
                </div>
                <FileUpload 
                  onFilesChange={setFiles}
                  maxFiles={5}
                  className="bg-slate-50/50 rounded-[40px] border-dashed border-slate-200"
                />
             </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</p>
                     <p className="text-sm font-bold text-slate-700 capitalize">{category.replace('_', ' ')}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</p>
                     <Badge className={cn(
                        "rounded-full font-black uppercase tracking-tighter",
                        priority === "critical" ? "bg-red-500" : "bg-primary"
                     )}>{priority}</Badge>
                  </div>
               </div>
               
               <div className="p-8 border-2 border-slate-100 rounded-[40px] space-y-4">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{watch("title")}</h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-bold text-slate-500">{watch("organizationName")}</span>
                  </div>
                  <div className="h-px bg-slate-100 w-full" />
                  <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-4">
                    {watch("description")}
                  </p>
                  <div className="pt-4 flex items-center gap-2">
                    <Badge variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {files.length} Evidence Attachment(s)
                    </Badge>
                  </div>
               </div>

               <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-widest px-10 leading-relaxed">
                  By submitting, you confirm that the information provided is accurate and truthful. Providing false information may lead to platform suspension.
               </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 pt-4 border-t border-slate-50 mt-10">
            {step > 1 && (
              <Button type="button" variant="ghost" onClick={prevStep} className="flex-1 rounded-full h-14 font-black uppercase tracking-widest text-xs">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" onClick={nextStep} className="flex-1 rounded-full h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                Next Step
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={createComplaint.isPending} className="flex-1 rounded-full h-14 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20">
                {createComplaint.isPending ? "Submitting Case..." : "Submit Formal Complaint"}
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewComplaintPage;
