import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import {
  Briefcase, DollarSign, MapPin, Image as ImageIcon,
  ChevronLeft, Loader2, Building2, Users, ShieldCheck,
  PlusCircle, UploadCloud, X, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { Spinner } from "@/components/common/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const jobSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  wageAmount: z.preprocess(
    (val) => Number(val),
    z.number().min(100, "Minimum wage requirement not met")
  ),
  wageFrequency: z.enum(["hourly", "daily", "weekly", "monthly", "per_task"]),
  jobType: z.enum(["full_time", "part_time", "contract", "temporary", "daily_wage"]),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Address is required"),
  compliesWithMinimumWage: z.boolean().default(true),
  imageUrl: z.string().optional().or(z.literal("")),
  status: z.enum(["open", "closed", "filled"]).default("open"),
});

const JobFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { useGetJob, createJob, updateJob } = useJobs();

  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const { data: job, isLoading: jobLoading } = useGetJob(id, { enabled: isEdit });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      wageFrequency: "daily",
      jobType: "contract",
      compliesWithMinimumWage: true,
      status: "open",
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        description: job.description,
        wageAmount: job.wage.amount,
        wageFrequency: job.wage.frequency,
        jobType: job.jobType,
        city: job.location.city,
        address: job.location.address,
        compliesWithMinimumWage: job.compliesWithMinimumWage,
        imageUrl: job.imageUrl || "",
        status: job.status,
      });
      if (job.imageUrl) setPreviewImage(job.imageUrl);
    }
  }, [job, reset]);

  // Drag & Drop Handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  // FIX: Complete handleFile implementation (was cut off / incomplete in original)
  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setPreviewImage(base64);
      setValue("imageUrl", base64);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreviewImage(null);
    setValue("imageUrl", "");
  };

  const onSubmit = async (data) => {
    const payload = {
      title: data.title,
      description: data.description,
      wage: { amount: data.wageAmount, frequency: data.wageFrequency, currency: "LKR" },
      location: { city: data.city, address: data.address, country: "Sri Lanka" },
      jobType: data.jobType,
      compliesWithMinimumWage: data.compliesWithMinimumWage,
      imageUrl: data.imageUrl || undefined,
      status: data.status,
    };
    try {
      if (isEdit) {
        await updateJob.mutateAsync({ id, data: payload });
        toast.success("Job listing updated successfully.");
      } else {
        await createJob.mutateAsync(payload);
        toast.success("Job listing published successfully.");
      }
      navigate("/employer/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save job listing.");
    }
  };

  if (isEdit && jobLoading) {
    return (
      <div className="p-32 flex flex-col items-center">
        <Spinner size="lg" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
          PULLING VACANCY DOCS...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in pb-20 mt-4">
      {/* Navigation */}
      <div className="flex justify-between items-center px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="rounded-full font-black uppercase tracking-widest text-[9px] text-slate-400 hover:text-primary transition-all">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] tracking-widest uppercase py-1">
          {isEdit ? "EDIT MODE" : "NEW VACANCY"}
        </Badge>
      </div>

      {/* Header */}
      <header className="space-y-3 px-4">
        <Badge
          variant="outline"
          className="text-primary border-primary/20 font-black uppercase tracking-[0.2em] text-[9px] px-4 py-1.5 rounded-full bg-primary/5">
          {isEdit ? "Update Listing" : "Post a New Role"}
        </Badge>
        <h1 className="text-5xl font-black tracking-tight text-slate-900 leading-tight">
          {isEdit ? "Edit" : "Create"} <br />
          <span className="text-primary italic">Opportunity.</span>
        </h1>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          All fields marked <span className="text-red-500">*</span> are required.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 px-4">
        {/* Main Details — 2 cols */}
        <div className="lg:col-span-2 space-y-8">
          {/* Core Info */}
          <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                Core Information
              </h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Senior Site Mason"
                  className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-sm font-bold shadow-inner"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-[9px] font-black uppercase text-red-500 tracking-widest ml-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Job Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none"
                    onChange={(e) => setValue("jobType", e.target.value)}
                    value={watch("jobType")}>
                    <option value="contract">Contract</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="temporary">Temporary</option>
                    <option value="daily_wage">Daily Wage</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Listing Status
                  </Label>
                  <select
                    className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none"
                    onChange={(e) => setValue("status", e.target.value)}
                    value={watch("status")}>
                    <option value="open">Open — Active Hiring</option>
                    <option value="filled">Filled — Candidate Found</option>
                    <option value="closed">Closed — Archive Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  Role Description & Requirements <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  placeholder="Describe responsibilities, safety requirements, and skills..."
                  className={cn(
                    "min-h-[220px] rounded-[32px] border-none bg-slate-50 p-6 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-primary/20 shadow-inner transition-all placeholder:text-slate-300",
                    errors.description && "ring-2 ring-red-100"
                  )}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-[9px] font-black uppercase text-red-500 tracking-widest ml-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Wages + Geography */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Wages */}
            <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Wages</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Amount (LKR) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-sm font-bold shadow-inner"
                    {...register("wageAmount")}
                  />
                  {errors.wageAmount && (
                    <p className="text-[9px] font-black uppercase text-red-500 tracking-widest ml-1">
                      {errors.wageAmount.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Payment Frequency
                  </Label>
                  <select
                    className="w-full h-14 rounded-2xl bg-slate-50 border-none px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner appearance-none"
                    onChange={(e) => setValue("wageFrequency", e.target.value)}
                    value={watch("wageFrequency")}>
                    <option value="per_task">Per Task</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Geography */}
            <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-8">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Geography</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    City / District <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Colombo 07"
                    className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-sm font-bold shadow-inner"
                    {...register("city")}
                  />
                  {errors.city && (
                    <p className="text-[9px] font-black uppercase text-red-500 tracking-widest ml-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Exact Worksite Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="123, Galle Road"
                    className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-sm font-bold shadow-inner"
                    {...register("address")}
                  />
                  {errors.address && (
                    <p className="text-[9px] font-black uppercase text-red-500 tracking-widest ml-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Image Upload */}
          <div className="bg-slate-900 p-10 rounded-[56px] text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/20 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-black uppercase tracking-tight">Visual Identity</h3>
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Job Banner Image
              </Label>

              <div
                className={cn(
                  "relative h-48 w-full rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all bg-white/5",
                  dragActive ? "border-primary bg-primary/10" : "border-white/10 hover:border-white/20",
                  previewImage ? "border-none p-0 overflow-hidden" : "p-6 text-center cursor-pointer"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !previewImage && document.getElementById("image-upload").click()}>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {previewImage ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={previewImage}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                        className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/50"
                        aria-label="Remove image">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className={cn("h-8 w-8 mb-3 transition-colors", dragActive ? "text-primary" : "text-slate-400")} />
                    <p className="text-sm font-bold text-slate-300">Drag & Drop an image here</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2 text-center leading-relaxed">
                      PNG, JPG or WEBP up to 5MB.<br />
                      Leave empty to use default template.
                    </p>
                  </>
                )}
              </div>
              <input type="hidden" {...register("imageUrl")} />
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex gap-4 items-center">
              <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase italic">
                Visuals help informal workers recognize worksites and trust your listing.
              </p>
            </div>
          </div>

          {/* Trust + Submit */}
          <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-xl shadow-slate-200/40 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-black text-slate-900 uppercase">Verification</h3>
              </div>

              <div className="space-y-6">
                {/* FIX: Checkbox wired to react-hook-form via setValue */}
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-primary/20">
                  <Checkbox
                    id="wageCompliance"
                    className="h-5 w-5 rounded-md border-2 border-slate-200"
                    checked={watch("compliesWithMinimumWage")}
                    onCheckedChange={(checked) =>
                      setValue("compliesWithMinimumWage", checked === true)
                    }
                  />
                  <Label
                    htmlFor="wageCompliance"
                    className="text-[10px] font-black text-slate-600 uppercase tracking-tight cursor-pointer leading-tight">
                    Listing complies with Sri Lanka minimum wage standards.
                  </Label>
                </div>

                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                  <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight">
                    Access Verified Workers
                  </p>
                  <p className="text-[9px] font-bold text-blue-600 uppercase italic mt-1">
                    Our platform connects you with workers whose identities are verified via biometrics.
                  </p>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-50 w-full" />

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full h-16 rounded-[32px] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/30 group"
                disabled={createJob.isPending || updateJob.isPending}>
                {createJob.isPending || updateJob.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    {isEdit ? "Update Opportunity" : "Publish Opportunity"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
              <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest italic leading-relaxed px-4">
                By publishing, you agree to the Fair-Work recruitment protocol and background
                verification standards.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobFormPage;