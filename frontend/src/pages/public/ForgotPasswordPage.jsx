import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await authApi.forgotPassword(email);
            toast.success(response.data.message || "Reset code sent to your email");
            navigate("/reset-password", { state: { email } });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send reset code");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper login-bg">
            <div className="auth-card animate-fade-in glass-container">
                <div className="auth-header">
                    <h2 className="text-3xl font-bold">Forgot Password</h2>
                    <p className="text-muted-foreground mt-2">Enter your registered email to receive a reset code</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Code"}
                    </Button>
                </form>

                <div className="auth-footer text-sm">
                    Remember your password?{" "}
                    <Link to="/login" className="text-primary font-semibold hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
