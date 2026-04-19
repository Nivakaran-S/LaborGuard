import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const OAuthSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const accessToken  = params.get("token");
    const refreshToken = params.get("refreshToken");
    const role         = params.get("role");
    // FIX: oauthController was NOT including userId and email in the redirect URL.
    // Without them, setAuth({ id: null, email: null, role }) → broken identity in store.
    // oauthController.js is now fixed to include both in the URL params.
    const userId       = params.get("userId");
    const email        = params.get("email");

    if (!accessToken) {
      navigate("/login?error=oauth_failed");
      return;
    }

    setAuth({ id: userId, email, role }, accessToken, refreshToken);

    // FIX: role from backend JWT is 'lawyer' (User model enum), not 'legal_officer'.
    // Consistent with ProtectedRoute.jsx and App.jsx.
    const roleRoutes = {
      admin    : "/admin/dashboard",
      worker   : "/worker/dashboard",
      employer : "/employer/dashboard",
      lawyer   : "/legal/dashboard",  // FIX: was 'lawyer' here but ProtectedRoute checked 'legal_officer'
      ngo      : "/ngo/dashboard",
    };

    setTimeout(() => {
      navigate(roleRoutes[role] || "/");
    }, 800);
  }, [navigate, location, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 p-8">
        <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">Authenticating...</h2>
        <p className="text-slate-500 text-sm">
          Securely connecting your account to LaborGuard.
        </p>
      </div>
    </div>
  );
};

export default OAuthSuccessPage;