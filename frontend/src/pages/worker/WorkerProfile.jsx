import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Input } from "@/components/common/Input";
import { Spinner } from "@/components/common/Spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/Avatar";
import {
  Camera, Mail, Phone, CheckCircle2, AlertTriangle,
  User, Briefcase, MapPin, Lock, Key, Save, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  occupation: z.string().min(2, "Occupation is too short"),
  location: z.string().min(2, "Location is too short"),
  preferredLanguage: z.enum(["en", "si", "ta"]),
});

const passwordSchema = z
  .object({
    current: z.string().min(1, "Current password is required"),
    next: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((data) => data.next === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

const WorkerProfile = () => {
  const { user, useGetProfile, updateProfile, changePassword } = useAuth();
  const { data: profile, isLoading } = useGetProfile();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      occupation: profile?.occupation || "",
      location: profile?.location || "",
      preferredLanguage: profile?.preferredLanguage || "en",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data) => {
    await updateProfile.mutateAsync(data);
  };

  const onPasswordSubmit = async (data) => {
    await changePassword.mutateAsync(data);
    resetPassword();
  };

  if (isLoading) {
    return (
      <div className="p-20 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row gap-8 items-start">

        {/* Left Column: Avatar + Verification */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <Avatar className="h-32 w-32 ring-8 ring-slate-50 shadow-inner">
                <AvatarImage src="/avatar-placeholder.png" alt={user?.firstName} />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl font-black">
                  {user?.firstName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {/* FIX: Camera button now properly triggers a hidden file input */}
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30
                           hover:scale-110 active:scale-95 transition-all cursor-pointer"
                aria-label="Upload new profile photo">
                <Camera className="h-5 w-5" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // In production: upload to storage service and call updateProfile
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      // updateProfile.mutateAsync({ avatarUrl: reader.result })
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{user?.role}</p>

            <div className="mt-8 w-full space-y-3">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</span>
                </div>
                {user?.isVerified
                  ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                  : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-black uppercase tracking-tight leading-tight">
              Trust & Verification
            </h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed">
              Your account is fully verified. This ensures you get priority legal support and
              access to verified job listings.
            </p>
            <div className="pt-4 flex gap-2">
              <Badge className="bg-primary text-white border-none py-1">Verified Worker</Badge>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="flex-1 space-y-8">
          {/* Profile Info Form */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Public Profile</h3>
            </div>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">
                    Current Occupation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      placeholder="e.g. Mason, Driver"
                      className="pl-12 h-12 rounded-2xl bg-slate-50/50"
                      {...registerProfile("occupation")}
                    />
                  </div>
                  {profileErrors.occupation && (
                    <p className="text-[10px] font-bold text-destructive ml-1">
                      {profileErrors.occupation.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">
                    Location District
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      placeholder="e.g. Colombo, Kandy"
                      className="pl-12 h-12 rounded-2xl bg-slate-50/50"
                      {...registerProfile("location")}
                    />
                  </div>
                  {profileErrors.location && (
                    <p className="text-[10px] font-bold text-destructive ml-1">
                      {profileErrors.location.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">
                  Preferred Language
                </label>
                <div className="flex gap-4">
                  {[
                    { id: "en", label: "English" },
                    { id: "si", label: "Sinhala (සිංහල)" },
                    { id: "ta", label: "Tamil (தமிழ்)" },
                  ].map((l) => (
                    <label
                      key={l.id}
                      className={cn(
                        "flex-1 p-4 border-2 rounded-2xl cursor-pointer transition-all text-center",
                        profile?.preferredLanguage === l.id
                          ? "bg-primary/5 border-primary"
                          : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                      )}>
                      <input
                        type="radio"
                        className="hidden"
                        value={l.id}
                        {...registerProfile("preferredLanguage")}
                      />
                      <span
                        className={cn(
                          "text-xs font-black uppercase tracking-widest",
                          profile?.preferredLanguage === l.id ? "text-primary" : "text-slate-500"
                        )}>
                        {l.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="w-full sm:w-auto px-10 h-12 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20">
                {updateProfile.isPending ? "Saving..." : "Update Profile"}
                <Save className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-2xl">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Security & Password</h3>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="h-12 rounded-2xl bg-slate-50/50"
                    {...registerPassword("current")}
                  />
                  {passwordErrors.current && (
                    <p className="text-[10px] font-bold text-destructive ml-1 uppercase">
                      {passwordErrors.current.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">
                      New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-2xl bg-slate-50/50"
                      {...registerPassword("next")}
                    />
                    {passwordErrors.next && (
                      <p className="text-[10px] font-bold text-destructive ml-1 uppercase">
                        {passwordErrors.next.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-tight text-slate-500 ml-1">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="h-12 rounded-2xl bg-slate-50/50"
                      {...registerPassword("confirm")}
                    />
                    {passwordErrors.confirm && (
                      <p className="text-[10px] font-bold text-destructive ml-1 uppercase">
                        {passwordErrors.confirm.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                variant="ghost"
                disabled={changePassword.isPending}
                className="w-full sm:w-auto px-10 h-12 rounded-full font-black uppercase tracking-widest text-xs border border-amber-200 text-amber-700 hover:bg-amber-50">
                {changePassword.isPending ? "Updating..." : "Change Password"}
                <Key className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;