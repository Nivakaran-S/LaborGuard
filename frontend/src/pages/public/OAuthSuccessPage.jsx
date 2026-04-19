import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const OAuthSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const params       = new URLSearchParams(location.search);
    const accessToken  = params.get("token");
    const refreshToken = params.get("refreshToken");
    const role         = params.get("role");
    const userId       = params.get("userId");  // FIX: now populated by oauthController
    const email        = params.get("email");   // FIX: now populated by oauthController

    if (!accessToken) { navigate("/login?error=oauth_failed"); return; }

    setAuth({ id: userId, email, role }, accessToken, refreshToken);

    // FIX: consistent with User model — role is 'lawyer' not 'legal_officer'
    setTimeout(() => {
      const routes = { admin:"/admin/dashboard", worker:"/worker/dashboard",
                       employer:"/employer/dashboard", lawyer:"/legal/dashboard", ngo:"/ngo/dashboard" };
      navigate(routes[role] || "/");
    }, 800);
  }, [navigate, location, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
        <h2 className="text-2xl font-bold">Authenticating...</h2>
      </div>
    </div>
  );
};
export default OAuthSuccessPage;