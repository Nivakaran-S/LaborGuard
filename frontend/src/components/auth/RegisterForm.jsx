import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { FileUpload } from "@/components/common/FileUpload";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Shield, 
  FileCheck, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is too short"),
  lastName: z.string().min(2, "Last name is too short"),
  birthDate: z.string().refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 18;
  }, "You must be at least 18 years old"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^07[0-9]{8}$/, "Phone must be in format 07XXXXXXXX"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[!@#$%^&*]/, "Must contain at least one special character (!@#$%^&*)"),
  confirmPassword: z.string(),
  role: z.enum(["worker", "employer", "lawyer", "ngo"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const RegisterForm = () => {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [docFiles, setDocFiles] = useState([]);

  const {
    register: registerField,
    handleSubmit,
    watch,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "",
    },
  });

  const role = watch("role");

  const nextStep = async () => {
    let fields = [];
    if (step === 1) fields = ["firstName", "lastName", "birthDate"];
    if (step === 2) fields = ["email", "phone", "password", "confirmPassword"];
    if (step === 3) fields = ["role"];

    const isValid = await trigger(fields);
    if (isValid) {
      const currentRole = getValues("role");
      const isWorker = currentRole === "worker";

      const totalSteps = isWorker ? 3 : 4;
      if (step < totalSteps) {
        setStep(step + 1);
      }
    }
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (values) => {
    // 🛡️ FORTRESS FIX: Always use getValues for the most up-to-date role
    const currentRole = getValues("role");
    
    // Safety generic validation, should never trigger but just in case
    if (!currentRole) {
       toast.error("Please select a role to register.");
       return;
    }

    const isWorker = currentRole === "worker";
    const totalSteps = isWorker ? 3 : 4;

    // 🛡️ FORTRESS FIX: If this is NOT the final step, DO NOT REGISTER.
    // Ensure accidental Enter keystrokes only navigate forward.
    if (step !== totalSteps) {
      await nextStep();
      return;
    }

    // Role-specific validation for non-workers
    if (!isWorker && docFiles.length === 0) {
      toast.error("Please upload verification documents");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => formData.append(key, values[key]));
      docFiles.forEach((file) => formData.append("documents", file));

      await register.mutateAsync(formData);
      console.log('✅ Registration request sent successfully');
    } catch (error) {
      console.error('❌ Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { title: "Personal", icon: User },
    { title: "Security", icon: Lock },
    { title: "Role", icon: Shield },
    ...(role !== "worker" ? [{ title: "Verify", icon: FileCheck }] : []),
  ];

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Progress Indicator */}
      <div className="relative mb-12">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2" />
        <div className="relative flex justify-between">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = step > i + 1;
            const isActive = step === i + 1;
            
            return (
              <div key={i} className="flex flex-col items-center gap-2 group">
                <div className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : 
                  isActive ? "bg-white border-primary text-primary ring-4 ring-primary/10 shadow-sm" : 
                  "bg-white border-slate-200 text-slate-400 group-hover:border-slate-300"
                )}>
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isActive || isCompleted ? "text-primary" : "text-slate-400"
                )}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">First Name</label>
              <Input placeholder="Enter first name" {...registerField("firstName")} />
              {errors.firstName && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Last Name</label>
              <Input placeholder="Enter last name" {...registerField("lastName")} />
              {errors.lastName && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Date of Birth</label>
              <Input type="date" {...registerField("birthDate")} />
              {errors.birthDate && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.birthDate.message}</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Email Address</label>
              <Input type="email" placeholder="email@example.com" {...registerField("email")} />
              {errors.email && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Phone Number</label>
              <Input placeholder="07XXXXXXXX" {...registerField("phone")} />
              {errors.phone && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.phone.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Password</label>
                <Input type="password" placeholder="••••••••" {...registerField("password")} />
                {errors.password && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">Confirm Password</label>
                <Input type="password" placeholder="••••••••" {...registerField("confirmPassword")} />
                {errors.confirmPassword && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: "worker", label: "Worker", desc: "Finding fair jobs & protection" },
                { id: "employer", label: "Employer", desc: "Posting verified vacancies" },
                { id: "lawyer", label: "Legal Officer", desc: "Handling assigned cases" },
                { id: "ngo", label: "NGO Rep", desc: "Supporting workers rights" },
              ].map((r) => (
                <label 
                  key={r.id}
                  onClick={() => setValue("role", r.id, { shouldValidate: true })}
                  className={cn(
                    "flex flex-col gap-2 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 group",
                    role === r.id ? "border-primary bg-primary/5 ring-4 ring-primary/5 shadow-md" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <input type="radio" className="hidden" value={r.id} {...registerField("role")} />
                  <span className={cn("text-xs font-black uppercase tracking-wider", role === r.id ? "text-primary" : "text-slate-800")}>{r.label}</span>
                  <span className="text-[10px] font-bold text-slate-500 tracking-tight leading-tight">{r.desc}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && role !== "worker" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start">
               <Shield className="h-5 w-5 text-amber-500 shrink-0" />
               <p className="text-[11px] font-bold text-amber-700 leading-relaxed uppercase italic">
                 Account verification required. Please upload your valid ID or professional credentials to access {role} features.
               </p>
             </div>
             <FileUpload 
                onFilesChange={setDocFiles}
                maxFiles={5}
                className="bg-white shadow-inner"
             />
          </div>
        )}

        <div className="flex justify-between gap-4 pt-8">
          {step > 1 && (
            <Button type="button" variant="ghost" onClick={prevStep} className="flex-1 rounded-full font-black uppercase tracking-widest text-xs h-12">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          {step < 4 && !(step === 3 && role === "worker") ? (
            <Button type="button" onClick={nextStep} className="flex-1 rounded-full font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20">
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
                type="submit" 
                disabled={isLoading || (step === 4 && role !== "worker" && docFiles.length === 0)} 
                className="flex-1 rounded-full font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20"
            >
              {isLoading ? "creating account..." : "Complete Registration"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};
