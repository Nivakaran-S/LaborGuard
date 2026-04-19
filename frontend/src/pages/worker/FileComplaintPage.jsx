import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  MapPin, 
  ShieldAlert, 
  Upload, 
  X,
  PlusCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { complaintApi } from "@/api/complaintApi";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

const complaintSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(30, "Description must be at least 30 characters"),
  category: z.enum([
    'wage_theft',
    'unsafe_conditions',
    'wrongful_termination',
    'harassment',
    'discrimination',
    'unpaid_overtime',
    'other'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  isAnonymous: z.boolean().default(false),
  organizationName: z.string().optional()
});

const FileComplaintPage = () => {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      isAnonymous: false,
      priority: 'medium'
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        location: {
          city: data.city,
          district: data.district,
          country: 'Sri Lanka'
        }
      };
      
      const response = await complaintApi.createComplaint(payload);
      const complaintId = response.data.data._id;

      // Handle attachments if any
      if (files.length > 0) {
        toast.info("Uploading attachments...");
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await complaintApi.uploadAttachment(complaintId, formData);
        }
      }

      toast.success("Complaint filed successfully!");
      navigate("/worker/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to file complaint");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header className="space-y-2 border-b pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">File a New Complaint</h1>
        <p className="text-muted-foreground text-lg italic">
          Help us protect your rights by providing detailed information about the dispute.
        </p>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card className="shadow-lg border-2">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Dispute Details
            </CardTitle>
            <CardDescription aria-level={2}>Provide the core information about the issue you are facing.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Complaint Title</Label>
              <Input 
                id="title" 
                placeholder="Brief summary of the issue (e.g., Unpaid wages for March)" 
                {...register("title")}
                className={errors.title ? "border-destructive" : ""}
              />
              {errors.title && <p className="text-xs text-destructive font-bold">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(val) => setValue("category", val)}>
                  <SelectTrigger id="category" className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wage_theft">Wage Theft</SelectItem>
                    <SelectItem value="unsafe_conditions">Unsafe Conditions</SelectItem>
                    <SelectItem value="wrongful_termination">Wrongful Termination</SelectItem>
                    <SelectItem value="harassment">Harassment</SelectItem>
                    <SelectItem value="discrimination">Discrimination</SelectItem>
                    <SelectItem value="unpaid_overtime">Unpaid Overtime</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive font-bold">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Initial Priority</Label>
                <Select defaultValue="medium" onValueChange={(val) => setValue("priority", val)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea 
                id="description" 
                placeholder="Explain in detail what happened, including dates, names, and specific events..." 
                className={`min-h-[150px] bg-slate-50 ${errors.description ? "border-destructive" : ""}`}
                {...register("description")}
              />
              {errors.description && <p className="text-xs text-destructive font-bold">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Location & Organization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-md border-2">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="w-4 h-4 text-primary" />
                        Location
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" placeholder="e.g. Colombo" {...register("city")} className={errors.city ? "border-destructive" : ""} />
                        {errors.city && <p className="text-xs text-destructive font-bold">{errors.city.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="district">District</Label>
                        <Input id="district" placeholder="e.g. Colombo District" {...register("district")} className={errors.district ? "border-destructive" : ""} />
                        {errors.district && <p className="text-xs text-destructive font-bold">{errors.district.message}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-md border-2">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <PlusCircle className="w-4 h-4 text-primary" />
                        Employer Info
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="org">Organization Name (Optional)</Label>
                        <Input id="org" placeholder="e.g. ABC Textiles" {...register("organizationName")} />
                    </div>
                    <div className="flex items-center space-x-2 pt-4">
                        <Checkbox 
                            id="anonymous" 
                            checked={watch("isAnonymous")}
                            onCheckedChange={(checked) => setValue("isAnonymous", checked === true)}
                        />
                        <Label htmlFor="anonymous" className="text-sm font-semibold cursor-pointer">File anonymously</Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">* Filing anonymously hides your identity from the employer but legal officers will still see it for verification.</p>
                </CardContent>
            </Card>
        </div>

        {/* Evidence Upload */}
        <Card className="shadow-md border-2 border-dashed">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Evidence & Attachments
            </CardTitle>
            <CardDescription aria-level={2}>Upload photos of contracts, payslips, or voice recordings as evidence.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 flex flex-col items-center">
            <div className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center hover:border-primary/50 transition-colors bg-slate-50/20 relative group">
                <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <PlusCircle className="w-12 h-12 text-slate-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-slate-600">Click or drag files to upload</p>
                <p className="text-xs text-slate-400 mt-2">Support for PDF, JPG, PNG, and MP3</p>
            </div>

            {files.length > 0 && (
                <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {files.map((file, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-sm font-semibold truncate">{file.name}</span>
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => removeFile(i)} className="text-destructive h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 pt-10">
            <Button type="button" variant="outline" className="flex-1 h-12" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" className="flex-[2] h-12 text-lg font-bold" disabled={isLoading}>
                {isLoading ? "Submitting Portfolio..." : "🚀 File Complaint Officialy"}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default FileComplaintPage;
