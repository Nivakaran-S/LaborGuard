import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const VerifyPage = () => {
    const [code, setCode] = useState("");
    const [type, setType] = useState("email");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const { verify } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const userId = location.state?.userId;
    const email = location.state?.email;

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!userId) {
            toast.error("Missing User ID. Please register again.");
            return;
        }
        if (code.length !== 6) {
            toast.error("Please enter a 6-digit code");
            return;
        }

        setIsLoading(true);
        try {
            await verify.mutateAsync({ userId, code, type });
        } catch (error) {
            // Error handled in hook
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            toast.error('Email is required to resend. Please log in again to fetch it.');
            return;
        }
        setIsResending(true);
        try {
            const response = await authApi.resendVerification(email);
            toast.success(response.data?.message || 'A fresh verification code was sent to your email.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 p-6">
            <div className="absolute top-8 left-8">
                <Button variant="ghost" onClick={() => navigate("/register")} className="rounded-full font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-primary transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Register
                </Button>
            </div>

            <div className="w-full max-w-md space-y-12 animate-fade-in">
                <div className="text-center space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-white shadow-2xl shadow-primary/30 mb-4 -rotate-3">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Verify Identity.</h1>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Secure your LaborGuard account</p>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Selection Verification Channel</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: "email", label: "Email", icon: Mail },
                                { id: "sms", label: "Phone", icon: Smartphone }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setType(t.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                                        type === t.id 
                                            ? "border-primary bg-primary/5 text-primary" 
                                            : "border-slate-100 text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    <t.icon className="h-5 w-5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 text-center block">Enter 6-Digit Code</label>
                            <Input
                                type="text"
                                maxLength={6}
                                placeholder="0 0 0 0 0 0"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                className="text-center h-16 rounded-2xl bg-slate-50 border-none shadow-inner text-2xl font-black tracking-[0.5em] text-primary focus:bg-white transition-all"
                                required
                            />
                            {!userId && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-red-700 uppercase leading-tight">Session expired. Please restart registration.</p>
                                </div>
                            )}
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isLoading || !userId} 
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Confirm Identity
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="text-center pt-2">
                        <button 
                            type="button"
                            onClick={handleResend}
                            disabled={isResending || !email}
                            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors underline underline-offset-4 disabled:opacity-50"
                        >
                            {isResending ? "Sending..." : "Resend Verification Code"}
                        </button>
                        {!email && (
                            <p className="text-[10px] font-bold text-red-500 mt-2 uppercase tracking-widest">
                                Email unavailable. Log in to resend.
                            </p>
                        )}
                    </div>
                </div>

                <div className="text-center p-6 bg-slate-100/50 rounded-3xl border border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase italic">
                        Verification is mandatory to maintain the integrity of our community and protect against fraudulent claims.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyPage;
