import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginForm = () => {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values) => {
        setIsLoading(true);
        try {
            await login.mutateAsync(values);
        } catch (error) {
            // Error is handled in the hook's onError
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                            placeholder="name@example.com" 
                            className="pl-12 h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                            {...register("email")} 
                        />
                    </div>
                    {errors.email && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                        <Link
                            to="/forgot-password"
                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4"
                        >
                            Forgot?
                        </Link>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-12 h-14 rounded-2xl bg-slate-50/50 border-slate-100 focus:bg-white transition-all shadow-inner"
                            {...register("password")} 
                        />
                    </div>
                    {errors.password && <p className="text-[10px] font-bold text-destructive ml-1 uppercase">{errors.password.message}</p>}
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 group"
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        Sign In to Account
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                )}
            </Button>
        </form>
    );
};
