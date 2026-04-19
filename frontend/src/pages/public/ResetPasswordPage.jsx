import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

const ResetPasswordPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialEmail = location.state?.email || "";

    const [formData, setFormData] = useState({
        email: initialEmail,
        code: "",
        password: "",
        confirmPassword: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword(formData.email, formData.code, formData.password);
            toast.success("Password reset successfully");
            navigate("/login");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to reset password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper login-bg">
            <div className="auth-card animate-fade-in glass-container">
                <div className="auth-header">
                    <h2 className="text-3xl font-bold">New Password</h2>
                    <p className="text-muted-foreground mt-2">Enter the reset code and your new password</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <Label>Email Address</Label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-1 text-center">
                        <Label className="text-left w-full block">6-Digit Code</Label>
                        <Input
                            type="text"
                            name="code"
                            maxLength={6}
                            placeholder="000000"
                            value={formData.code}
                            onChange={(e) => setFormData({...formData, code: e.target.value.replace(/\D/g, "")})}
                            className="text-center font-bold tracking-[0.5em]"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>New Password</Label>
                        <Input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <Label>Confirm Password</Label>
                        <Input
                            type="password"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                </form>

                <div className="auth-footer text-sm">
                    <Link to="/login" className="text-primary font-semibold hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
